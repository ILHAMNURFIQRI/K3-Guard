"""RBAC: satu-satunya tempat yang menentukan siapa boleh apa. Endpoint memakai Depends(need("izin"))."""

STUDENT = {"monitoring.view", "chat.ask", "sop.read", "area.read"}
OFFICER = STUDENT | {"chat.sources", "chat.unanswered", "event.view", "event.verify", "stats.view",
                     "sop.manage", "area.manage", "settings.manage", "stream.control", "notification.receive"}
PERMISSIONS = {"student": STUDENT, "officer": OFFICER}


def can(role, perm):
    return perm in PERMISSIONS.get(role, ())
