/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchFromNeynar(channel: string) {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/channel/member/list?channel_id=${channel}&limit=100`,
    { headers: { api_key: process.env.NEYNAR_KEY! } },
  );
  const data = await res.json();
  return data.users.map((u: any) => ({
    fid: u.fid,
    username: u.username,
    score: calculateScore(u), // Add your scoring logic
  }));
}

function calculateScore(user: any): number {
  // Example: 1 point per post, 0.5 per like/reply
  return user.posts + user.likes * 0.5 + user.replies * 0.5;
}
