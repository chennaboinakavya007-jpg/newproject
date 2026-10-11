import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateTaskBody,
  CreateTaskResponse,
  DeleteTaskParams,
  DeleteTaskResponse,
  GetDashboardResponse,
  GetInternshipsResponse,
  GetProfileResponse,
  GetProjectsResponse,
  GetSavedProjectsResponse,
  GetTasksResponse,
  RemoveSavedProjectParams,
  RemoveSavedProjectResponse,
  SaveProjectBody,
  SaveProjectResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";
import {
  db,
  learningTasksTable,
  savedProjectsTable,
  studentProfilesTable,
} from "@workspace/db";

const router: IRouter = Router();

const projects = [
  {
    id: "p1",
    title: "Student Placement Tracker",
    skills: ["JavaScript", "Node.js", "Database"],
    level: "Beginner",
    description: "Track placement preparation, skills and progress.",
  },
  {
    id: "p2",
    title: "AI Mock Interview Practice",
    skills: ["Python", "AI", "Communication"],
    level: "Intermediate",
    description: "Practice interview questions and record your answers.",
  },
  {
    id: "p3",
    title: "Online Book Management System",
    skills: ["Java", "Database", "Web Development"],
    level: "Beginner",
    description: "Manage books, searches and borrowing records.",
  },
  {
    id: "p4",
    title: "Student Skill Roadmap",
    skills: ["HTML", "CSS", "JavaScript"],
    level: "Beginner",
    description: "Plan learning goals and monitor completed tasks.",
  },
];

const internships = [
  {
    id: "i1",
    title: "Web Development Intern",
    company: "Sample Company",
    skills: ["HTML", "CSS", "JavaScript"],
    type: "Internship",
    note: "Sample listing for demonstration",
  },
  {
    id: "i2",
    title: "Python Intern",
    company: "Demo Tech",
    skills: ["Python", "Problem Solving"],
    type: "Internship",
    note: "Sample listing for demonstration",
  },
  {
    id: "i3",
    title: "Software Trainee",
    company: "Example Solutions",
    skills: ["Java", "SQL", "DSA"],
    type: "Entry Level",
    note: "Sample listing for demonstration",
  },
];

type ProfileRecord = typeof studentProfilesTable.$inferSelect;
type TaskRecord = typeof learningTasksTable.$inferSelect;

async function ensureProfile(): Promise<ProfileRecord> {
  await db
    .insert(studentProfilesTable)
    .values({ id: 1 })
    .onConflictDoNothing({ target: studentProfilesTable.id });

  const [profile] = await db
    .select()
    .from(studentProfilesTable)
    .where(eq(studentProfilesTable.id, 1));

  if (!profile) {
    throw new Error("Could not load the student profile");
  }
  return profile;
}

function taskResponse(task: TaskRecord) {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
  };
}

function profileResponse(profile: ProfileRecord) {
  return {
    name: profile.name,
    branch: profile.branch,
    year: profile.year,
    interests: profile.interests,
  };
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  const [profile, tasks, savedProjects] = await Promise.all([
    ensureProfile(),
    db.select().from(learningTasksTable).orderBy(desc(learningTasksTable.createdAt)),
    db.select().from(savedProjectsTable),
  ]);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const taskResponses = tasks.map(taskResponse);

  res.json(
    GetDashboardResponse.parse({
      profile: profileResponse(profile),
      totalTasks: tasks.length,
      completedTasks,
      activeTasks: tasks.length - completedTasks,
      savedProjects: savedProjects.length,
      internshipCount: internships.length,
      completionRate:
        tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100),
      recentTasks: taskResponses.slice(0, 4),
    }),
  );
});

router.get("/profile", async (_req, res): Promise<void> => {
  const profile = await ensureProfile();
  res.json(GetProfileResponse.parse(profileResponse(profile)));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await ensureProfile();
  const changes = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  );
  const [profile] =
    Object.keys(changes).length > 0
      ? await db
          .update(studentProfilesTable)
          .set(changes)
          .where(eq(studentProfilesTable.id, current.id))
          .returning()
      : [current];

  res.json(UpdateProfileResponse.parse(profileResponse(profile)));
});

router.get("/tasks", async (_req, res): Promise<void> => {
  const tasks = await db
    .select()
    .from(learningTasksTable)
    .orderBy(desc(learningTasksTable.createdAt));
  res.json(GetTasksResponse.parse(tasks.map(taskResponse)));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [task] = await db
    .insert(learningTasksTable)
    .values({
      title: parsed.data.title.trim(),
      category: parsed.data.category?.trim() || "Learning",
    })
    .returning();

  res.status(201).json(CreateTaskResponse.parse(taskResponse(task)));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const changes = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  );
  const [task] =
    Object.keys(changes).length > 0
      ? await db
          .update(learningTasksTable)
          .set(changes)
          .where(eq(learningTasksTable.id, params.data.id))
          .returning()
      : await db
          .select()
          .from(learningTasksTable)
          .where(eq(learningTasksTable.id, params.data.id));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateTaskResponse.parse(taskResponse(task)));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(learningTasksTable)
    .where(eq(learningTasksTable.id, params.data.id))
    .returning({ id: learningTasksTable.id });
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(DeleteTaskResponse.parse({ success: true }));
});

router.get("/projects", (_req, res): void => {
  res.json(GetProjectsResponse.parse(projects));
});

router.get("/saved-projects", async (_req, res): Promise<void> => {
  const saved = await db
    .select()
    .from(savedProjectsTable)
    .orderBy(desc(savedProjectsTable.savedAt));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const response = saved.flatMap((item) => {
    const project = projectById.get(item.projectId);
    return project
      ? [{ ...project, savedAt: item.savedAt.toISOString() }]
      : [];
  });
  res.json(GetSavedProjectsResponse.parse(response));
});

router.post("/saved-projects", async (req, res): Promise<void> => {
  const parsed = SaveProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const project = projects.find((item) => item.id === parsed.data.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db
    .insert(savedProjectsTable)
    .values({ projectId: project.id })
    .onConflictDoNothing({ target: savedProjectsTable.projectId });
  const [saved] = await db
    .select()
    .from(savedProjectsTable)
    .where(eq(savedProjectsTable.projectId, project.id));

  res
    .status(201)
    .json(
      SaveProjectResponse.parse({
        ...project,
        savedAt: saved.savedAt.toISOString(),
      }),
    );
});

router.delete("/saved-projects/:projectId", async (req, res): Promise<void> => {
  const params = RemoveSavedProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(savedProjectsTable)
    .where(eq(savedProjectsTable.projectId, params.data.projectId));
  res.json(RemoveSavedProjectResponse.parse({ success: true }));
});

router.get("/internships", (_req, res): void => {
  res.json(GetInternshipsResponse.parse(internships));
});

export default router;
