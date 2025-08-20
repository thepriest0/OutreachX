export default function handler(req, res) {
  res.status(200).json({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin'
  });
}
