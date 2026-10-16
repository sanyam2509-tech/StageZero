import api from "./axios";

// ==================== AUTH API ====================
export const authApi = {
  register: async (userData) => {
    const res = await api.post("/auth/register", userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },
  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },
  getMe: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },
  demoLogin: async (role) => {
    const res = await api.post("/auth/demo-login", { role });
    return res.data;
  },
};

// ==================== FESTS API ====================
export const festsApi = {
  getAllFests: async (params = {}) => {
    const res = await api.get("/fests", { params });
    return res.data;
  },
  getFestBySlug: async (slug) => {
    const res = await api.get(`/fests/${slug}`);
    return res.data;
  },
  createFest: async (festData) => {
    const res = await api.post("/fests", festData);
    return res.data;
  },
  addOrganizer: async (festId, email) => {
    const res = await api.post(`/fests/${festId}/organizers`, { email });
    return res.data;
  },
  removeOrganizer: async (festId, userId) => {
    const res = await api.delete(`/fests/${festId}/organizers/${userId}`);
    return res.data;
  },
};

// ==================== EVENTS API ====================
export const eventsApi = {
  getEventById: async (eventId) => {
    const res = await api.get(`/events/${eventId}`);
    return res.data;
  },
  createEvent: async (eventData) => {
    const res = await api.post("/events", eventData);
    return res.data;
  },
  updateEvent: async (eventId, updateData) => {
    const res = await api.put(`/events/${eventId}`, updateData);
    return res.data;
  },
  assignJudges: async (eventId, judgeEmails) => {
    const res = await api.post(`/events/${eventId}/judges`, {
      emails: judgeEmails,
    });
    return res.data;
  },
  broadcastAnnouncement: async (eventId, announcementData) => {
    const res = await api.post(
      `/events/${eventId}/announcements`,
      announcementData
    );
    return res.data;
  },
};

// ==================== TEAMS API ====================
export const teamsApi = {
  createTeam: async (teamData) => {
    const res = await api.post("/teams", teamData);
    return res.data;
  },
  joinTeam: async (inviteCode) => {
    const res = await api.post("/teams/join", { inviteCode });
    return res.data;
  },
  leaveTeam: async (teamId) => {
    const res = await api.post(`/teams/${teamId}/leave`);
    return res.data;
  },
  toggleCheckIn: async (teamId, checkedIn) => {
    const res = await api.patch(`/teams/${teamId}/checkin`, { checkedIn });
    return res.data;
  },
  getMyTeam: async (eventId) => {
    const res = await api.get(`/teams/events/${eventId}/my-team`);
    return res.data;
  },
  getTeamsByEvent: async (eventId) => {
    const res = await api.get(`/teams/events/${eventId}`);
    return res.data;
  },
};

// ==================== SUBMISSIONS API ====================
export const submissionsApi = {
  createOrUpdateSubmission: async (submissionData) => {
    const res = await api.post("/submissions", submissionData);
    return res.data;
  },
  getSubmissionsByEvent: async (eventId, params = {}) => {
    const res = await api.get(`/submissions/events/${eventId}`, { params });
    return res.data;
  },
  getSubmissionById: async (submissionId) => {
    const res = await api.get(`/submissions/${submissionId}`);
    return res.data;
  },
};

// ==================== EVALUATIONS & CERTIFICATES API ====================
export const evaluationsApi = {
  submitEvaluation: async (evaluationData) => {
    const res = await api.post("/evaluations", evaluationData);
    return res.data;
  },
  getLiveLeaderboard: async (eventId) => {
    const res = await api.get(`/evaluations/events/${eventId}/leaderboard`);
    return res.data;
  },
  downloadCertificate: async (eventId, teamId, fileName = "Certificate.pdf") => {
    const res = await api.get(
      `/evaluations/events/${eventId}/certificate/${teamId}`,
      {
        responseType: "blob",
      }
    );
    // Create download blob link in browser
    const blob = new Blob([res.data], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  },
};
