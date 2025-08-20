// Simple user API endpoint for testing
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // For now, return a test user
  res.status(200).json({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin',
    message: 'This is a test user - database not connected yet'
  });
}
