export default function handler(req, res) {
  res.status(200).json({
    totalLeads: 0,
    emailsSent: 0,
    responseRate: 0,
    openRate: 0
  });
}
