const prisma = require("../config/prisma");
let _io = null;
// Call this once from server.js after Socket.io is initialised
exports.setIO = (io) => {
  _io = io;
};

// ------------------- DASHBOARD OVERVIEW -------------------
// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [userCount, teamCount, attackCount, defenseCount, teams] =
      await Promise.all([
        prisma.user.count(),
        prisma.team.count(),
        prisma.attackLog.count(),
        prisma.defenseLog.count(),
        prisma.team.findMany({
          select: {
            id: true,
            name: true,
            role: true,
            score: true,
            _count: { select: { members: true } },
          },
          orderBy: { score: "desc" },
        }),
      ]);

    res.json({
      stats: { userCount, teamCount, attackCount, defenseCount },
      leaderboard: teams,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET ALL USERS -------------------
// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        teamMember: {
          select: {
            team: { select: { id: true, name: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- DELETE USER -------------------
// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.teamMember.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET ALL TEAMS -------------------
// GET /api/admin/teams
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, role: true } },
          },
        },
      },
      orderBy: { score: "desc" },
    });

    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- CREATE TEAM -------------------
// POST /api/admin/teams
// Body: { name, role }
exports.createTeam = async (req, res) => {
  try {
    const { name, role } = req.body;

    if (!["RED", "BLUE"].includes(role)) {
      return res.status(400).json({ error: "Role must be RED or BLUE" });
    }

    const team = await prisma.team.create({ data: { name, role } });
    res.status(201).json({ message: "Team created", team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- DELETE TEAM -------------------
// DELETE /api/admin/teams/:id
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teamMember.deleteMany({ where: { teamId: id } });
    await prisma.attackLog.deleteMany({
      where: { OR: [{ attackerId: id }, { targetTeamId: id }] },
    });
    await prisma.defenseLog.deleteMany({ where: { teamId: id } });
    await prisma.scoreHistory.deleteMany({ where: { teamId: id } });
    await prisma.team.delete({ where: { id } });

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- ASSIGN USER TO TEAM -------------------
// POST /api/admin/teams/:teamId/members
// Body: { userId }
exports.assignUserToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const count = await prisma.teamMember.count({ where: { teamId } });
    if (count >= 4) {
      return res.status(400).json({ error: "Team is full (max 4 members)" });
    }

    const membership = await prisma.teamMember.upsert({
      where: { userId },
      update: { teamId },
      create: { userId, teamId },
    });

    res.json({ message: "User assigned to team", membership });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- REMOVE USER FROM TEAM -------------------
// DELETE /api/admin/teams/:teamId/members/:userId
exports.removeUserFromTeam = async (req, res) => {
  try {
    const { userId } = req.params;
    await prisma.teamMember.delete({ where: { userId } });
    res.json({ message: "User removed from team" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- ADJUST TEAM SCORE -------------------
// PATCH /api/admin/teams/:id/score
// Body: { delta }
exports.adjustScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    if (typeof delta !== "number") {
      return res.status(400).json({ error: "delta must be a number" });
    }

    const team = await prisma.team.update({
      where: { id },
      data: { score: { increment: delta } },
    });

    res.json({ message: "Score updated", team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- RESET ALL SCORES -------------------
// POST /api/admin/scores/reset
exports.resetAllScores = async (req, res) => {
  try {
    await prisma.team.updateMany({ data: { score: 0 } });
    res.json({ message: "All scores reset to 0" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET ALL ATTACK LOGS -------------------
// GET /api/admin/logs/attacks
exports.getAttackLogs = async (req, res) => {
  try {
    const { teamId } = req.query;

    const logs = await prisma.attackLog.findMany({
      where: teamId ? { attackerId: teamId } : undefined,
      include: {
        attacker: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET ALL DEFENSE LOGS -------------------
// GET /api/admin/logs/defenses
exports.getDefenseLogs = async (req, res) => {
  try {
    const { teamId } = req.query;

    const logs = await prisma.defenseLog.findMany({
      where: teamId ? { teamId } : undefined,
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- CLEAR ALL LOGS -------------------
// DELETE /api/admin/logs
exports.clearAllLogs = async (req, res) => {
  try {
    await prisma.attackLog.deleteMany();
    await prisma.defenseLog.deleteMany();
    res.json({ message: "All logs cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- PROMOTE USER TO ADMIN -------------------
// PATCH /api/admin/users/:id/promote
exports.promoteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { role: "admin" },
      select: { id: true, username: true, role: true },
    });

    res.json({ message: "User promoted to admin", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =================================================================
// =================== SCORING ENHANCEMENTS ========================
// =================================================================

// ------------------- AWARD BONUS POINTS -------------------
// POST /api/admin/teams/:id/bonus
// Body: { points, reason }
// Use for: creativity, advanced technique, clean mitigation
exports.awardBonusPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    if (typeof points !== "number" || points <= 0) {
      return res
        .status(400)
        .json({ error: "points must be a positive number" });
    }
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res
        .status(400)
        .json({ error: "reason is required for bonus points" });
    }

    // Award points and log the event in a transaction
    const [team, historyEntry] = await prisma.$transaction([
      prisma.team.update({
        where: { id },
        data: { score: { increment: points } },
        select: { id: true, name: true, score: true, role: true },
      }),
      prisma.scoreHistory.create({
        data: {
          teamId: id,
          delta: points,
          reason: reason.trim(),
          type: "BONUS",
        },
      }),
    ]);

    res.json({
      message: `Bonus of +${points} awarded to ${team.name}`,
      team,
      historyEntry,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- DEDUCT POINTS (PENALTY) -------------------
// POST /api/admin/teams/:id/penalty
// Body: { points, reason }
// Use for: rule violations, unsportsmanlike conduct, cheating
exports.deductPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, reason } = req.body;

    if (typeof points !== "number" || points <= 0) {
      return res
        .status(400)
        .json({
          error: "points must be a positive number (it will be deducted)",
        });
    }
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res
        .status(400)
        .json({ error: "reason is required for a penalty" });
    }

    const [team, historyEntry] = await prisma.$transaction([
      prisma.team.update({
        where: { id },
        data: { score: { decrement: points } },
        select: { id: true, name: true, score: true, role: true },
      }),
      prisma.scoreHistory.create({
        data: {
          teamId: id,
          delta: -points,
          reason: reason.trim(),
          type: "PENALTY",
        },
      }),
    ]);

    res.json({
      message: `Penalty of -${points} applied to ${team.name}`,
      team,
      historyEntry,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET SCORE HISTORY -------------------
// GET /api/admin/scores/history
// Optional query: ?teamId=xxx  to filter by team
// Returns full audit trail of all score changes (bonuses, penalties, manual adjustments)
exports.getScoreHistory = async (req, res) => {
  try {
    const { teamId } = req.query;

    const history = await prisma.scoreHistory.findMany({
      where: teamId ? { teamId } : undefined,
      include: {
        team: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach running totals per team for easy frontend rendering
    const grouped = history.reduce((acc, entry) => {
      if (!acc[entry.teamId]) acc[entry.teamId] = [];
      acc[entry.teamId].push(entry);
      return acc;
    }, {});

    res.json({ history, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET SCORE HISTORY FOR ONE TEAM -------------------
// GET /api/admin/teams/:id/score-history
// Convenience endpoint — timeline of a single team's score changes
exports.getTeamScoreHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [team, history] = await Promise.all([
      prisma.team.findUnique({
        where: { id },
        select: { id: true, name: true, role: true, score: true },
      }),
      prisma.scoreHistory.findMany({
        where: { teamId: id },
        orderBy: { createdAt: "asc" }, // asc for timeline charts
      }),
    ]);

    if (!team) return res.status(404).json({ error: "Team not found" });

    // Build cumulative score timeline
    let running = 0;
    const timeline = history.map((entry) => {
      running += entry.delta;
      return { ...entry, runningTotal: running };
    });

    res.json({ team, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- RESET ALL SCORES (WITH HISTORY WIPE) -------------------
// POST /api/admin/scores/full-reset
// Hard reset — zeroes all scores AND clears score history
// Use at start of a new competition round
exports.fullScoreReset = async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.scoreHistory.deleteMany(),
      prisma.team.updateMany({ data: { score: 0 } }),
    ]);

    res.json({ message: "All scores and score history reset for new round" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =================================================================
// ====================== ANNOUNCEMENTS ============================
// =================================================================

// ------------------- CREATE ANNOUNCEMENT -------------------
// POST /api/admin/announcements
// Body: { title, message, type }
// type: "INFO" | "WARNING" | "ALERT" | "SUCCESS"
// Broadcasts to all participants (Red + Blue teams see this on their dashboards)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, type = "INFO" } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "title is required" });
    }
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "message is required" });
    }
    if (!["INFO", "WARNING", "ALERT", "SUCCESS"].includes(type)) {
      return res
        .status(400)
        .json({ error: "type must be INFO, WARNING, ALERT, or SUCCESS" });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        type,
      },
    });

    // Emit real-time event to all connected participants
    if (_io) _io.emit("new_announcement", announcement);

    res.status(201).json({ message: "Announcement created", announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- GET ALL ANNOUNCEMENTS -------------------
// GET /api/admin/announcements
// Optional query: ?type=ALERT  to filter by type
// Also used by the participant-facing feed
exports.getAnnouncements = async (req, res) => {
  try {
    const { type } = req.query;

    const validTypes = ["INFO", "WARNING", "ALERT", "SUCCESS"];
    if (type && !validTypes.includes(type)) {
      return res
        .status(400)
        .json({ error: `type must be one of: ${validTypes.join(", ")}` });
    }

    const announcements = await prisma.announcement.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "desc" },
    });

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- UPDATE ANNOUNCEMENT -------------------
// PATCH /api/admin/announcements/:id
// Body: { title?, message?, type?, pinned? }
// Use to correct typos or pin/unpin an important announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, pinned } = req.body;

    if (type && !["INFO", "WARNING", "ALERT", "SUCCESS"].includes(type)) {
      return res
        .status(400)
        .json({ error: "type must be INFO, WARNING, ALERT, or SUCCESS" });
    }

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (message !== undefined) data.message = message.trim();
    if (type !== undefined) data.type = type;
    if (pinned !== undefined) data.pinned = Boolean(pinned);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    });

    res.json({ message: "Announcement updated", announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- DELETE ANNOUNCEMENT -------------------
// DELETE /api/admin/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------- CLEAR ALL ANNOUNCEMENTS -------------------
// DELETE /api/admin/announcements
// Wipes the entire announcement board — use between rounds
exports.clearAllAnnouncements = async (req, res) => {
  try {
    const { count } = await prisma.announcement.deleteMany();
    res.json({ message: `Cleared ${count} announcement(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
