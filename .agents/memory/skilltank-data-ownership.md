---
name: SkillTank data ownership
description: Ownership and sample-data constraints for the SkillTank dashboard.
---

The first SkillTank version is a single, unauthenticated workspace. Profile, learning tasks, and saved projects are shared by all visitors. Project ideas and internship opportunities are sample listings.

**Why:** The supplied starter API had one profile and one global task list, and the request did not ask for accounts. The initial build retained that single-user workflow while moving persistence into PostgreSQL.

**How to apply:** Before using the app for multiple students or collecting private information, add authentication and scope profile, task, and saved-project data to the authenticated student. Treat the sample project and internship listings as demo content until replaced by a real source.
