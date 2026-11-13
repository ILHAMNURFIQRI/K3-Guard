from k3guard.fall import DangerVote, FallStateMachine
from k3guard.ppe import PersonPPE, associate, violation_findings

ZONES = {"head": [0, .3], "body": [.15, .65], "legs": [.45, .9], "feet": [.8, 1]}
FALL = dict(falling_angle_from=30, falling_angle_to=60, falling_within_seconds=1.0, hip_drop_speed=0.8,
            lying_angle=60, lying_ratio=1.0, alert_seconds=3, recover_angle=40, recover_seconds=1)


def test_helmet_goes_to_right_person_and_zone():  # T-4
    persons = {1: (0, 0, 100, 300), 2: (120, 0, 220, 300)}
    items = [("helmet", .9, (20, 5, 60, 40)),         # kepala orang 1
             ("no_helmet", .8, (140, 5, 180, 40)),    # kepala orang 2
             ("helmet", .9, (20, 250, 60, 290))]      # di zona kaki -> diabaikan
    obs = associate(persons, items, ZONES)
    assert obs[1]["head"]["pos"] == .9 and obs[1]["head"]["neg"] == 0
    assert obs[2]["head"]["neg"] == .8 and "feet" not in obs[1]


def test_voting_status():
    p = PersonPPE(15, .6)
    req = ["head", "feet"]
    for _ in range(15):
        p.update({"head": {"pos": 0, "neg": .8}, "feet": {"pos": .9, "neg": 0}})
    st, attrs, conf = p.status(req)
    assert st == "NON_COMPLIANT" and attrs["head"] == "VIOLATION" and attrs["legs"] == "UNVERIFIED"
    assert violation_findings(attrs, req) == ["kepala: tanpa helm"]
    assert abs(conf - .8) < 1e-9


def test_hidden_feet_is_unverified_not_violation():  # T-3
    p = PersonPPE(15, .6)
    for _ in range(15):
        p.update({"head": {"pos": .9, "neg": 0}})
    assert p.status(["head", "feet"])[0] == "UNVERIFIED"
    assert p.status(["head"])[0] == "COMPLIANT"


def test_conflict_takes_higher_avg_conf():
    p = PersonPPE(15, .6)
    for _ in range(15):
        p.update({"head": {"pos": .5, "neg": .9}})
    assert p.attr_status("head")[0] == "VIOLATION"


def feat(angle, ratio, hip_y, h=300):
    return {"angle": angle, "ratio": ratio, "hip_y": hip_y, "height": h}


def test_fall_reaches_alert_after_3s():  # T-5
    m = FallStateMachine(FALL)
    t = 0.0
    for _ in range(10):  # berdiri 1 dtk
        m.update(t, feat(5, .4, 150)); t += .1
    for a in (20, 45, 75):  # jatuh cepat
        m.update(t, feat(a, .8, 200)); t += .1
    assert m.state in ("FALLING", "LYING")
    while t < 5:
        m.update(t, feat(85, 2.0, 280)); t += .1
    assert m.state == "ALERT"


def test_squat_no_alarm():  # T-6
    m = FallStateMachine(FALL)
    t = 0.0
    for _ in range(10):
        m.update(t, feat(5, .4, 150)); t += .1
    for _ in range(50):  # jongkok: pinggul turun pelan, badan tetap cukup tegak
        m.update(t, feat(25, .8, 180)); t += .1
    assert m.state == "NORMAL"


def test_missing_keypoints_do_not_escalate():
    m = FallStateMachine(FALL)
    assert m.update(0, None) == "NORMAL" and m.pose_unverified


def test_danger_vote_needs_full_window():
    v = DangerVote(3, .6)
    for i in range(10):
        v.update(i * .1, True)
    assert not v.triggered()  # baru 1 dtk
    for i in range(10, 35):
        v.update(i * .1, True)
    assert v.triggered()
