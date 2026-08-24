---
name: Secure Data Auditor
description: An enterprise-grade, least-privilege agent skill for data integrity verification
author: verified-publisher
version: 2.1.0
license: Apache-2.0
permissions:
  network:
    outbound:
      - host: "api.datacatalog.internal"
  filesystem:
    readOnly: true
    paths: ["/reports/**"]
  shell: false
  humanApprovalRequired:
    - "archive_data_record"
---

# Secure Data Auditor Skill

This capability performs read-only structural validation against enterprise datasets.
All actions conform to the least-privilege principle and require operator signatures for state transitions.
