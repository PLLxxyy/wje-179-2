import bcrypt from 'bcryptjs';
import db, { initDB } from './db';

initDB();

// Clear existing data
db.exec('DELETE FROM post_comments');
db.exec('DELETE FROM post_likes');
db.exec('DELETE FROM community_posts');
db.exec('DELETE FROM practice_logs');
db.exec('DELETE FROM checkin_records');
db.exec('DELETE FROM users');

console.log('正在初始化测试数据...');

// Create users
const users = [
  { username: 'admin', password: 'admin123', instrument: '钢琴', daily_goal: 60, role: 'admin' },
  { username: 'xiaoming', password: '123456', instrument: '吉他', daily_goal: 30, role: 'user' },
  { username: 'xiaohong', password: '123456', instrument: '小提琴', daily_goal: 45, role: 'user' },
  { username: 'xiaogang', password: '123456', instrument: '架子鼓', daily_goal: 30, role: 'user' },
  { username: 'xiaoli', password: '123456', instrument: '钢琴', daily_goal: 60, role: 'user' },
];

const insertUser = db.prepare(
  'INSERT INTO users (username, password, instrument, daily_goal, role, bio) VALUES (?, ?, ?, ?, ?, ?)'
);

const userIds: number[] = [];
for (const u of users) {
  const hashed = bcrypt.hashSync(u.password, 10);
  const result = insertUser.run(u.username, hashed, u.instrument, u.daily_goal, u.role, `大家好，我是${u.username}，正在学${u.instrument}`);
  userIds.push(result.lastInsertRowid as number);
  console.log(`  创建用户: ${u.username} (ID: ${result.lastInsertRowid})`);
}

// Generate practice data for the last 30 days
const songs: Record<string, string[]> = {
  '钢琴': ['致爱丽丝', '梦中的婚礼', '卡农', '月光奏鸣曲', '菊次郎的夏天'],
  '吉他': ['Romance', '小星星', '加州旅馆', '爱的罗曼史', '天空之城'],
  '小提琴': ['梁祝', '沉思曲', '四季-春', '流浪者之歌', '幽默曲'],
  '架子鼓': ['逆战', '光辉岁月', '夜空中最亮的星', '倔强', '离开地球表面'],
};

const notes = [
  '今天练习感觉不错，手指灵活了很多',
  '节奏还需要加强，明天继续练习这个部分',
  '终于把难点攻克了，开心！',
  '老师说的技巧今天试了一下，确实有效',
  '练了两个小时，手指有点疼但是值得',
  '这首曲子已经能完整弹下来了',
  '和弦转换还不够流畅，需要多练习',
  '今天状态一般，但还是坚持练完了',
  '发现了一个新的练习方法，效率提高不少',
  '录了一段视频，比上周进步很多',
];

const insertLog = db.prepare(
  'INSERT INTO practice_logs (user_id, instrument, duration, song, notes, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
const insertCheckin = db.prepare(
  'INSERT OR REPLACE INTO checkin_records (user_id, date, total_duration, goal_met) VALUES (?, ?, ?, ?)'
);

const now = new Date();
for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
  const date = new Date(now);
  date.setDate(now.getDate() - dayOffset);
  const dateStr = date.toISOString().split('T')[0];

  for (let i = 1; i < userIds.length; i++) { // skip admin
    const user = users[i];
    const userSongs = songs[user.instrument] || songs['钢琴'];

    // Random chance of practicing (80% for recent days, less for older)
    const practiceChance = dayOffset < 7 ? 0.9 : dayOffset < 14 ? 0.8 : 0.7;
    if (Math.random() > practiceChance) continue;

    // 1-3 sessions per day
    const sessions = Math.floor(Math.random() * 3) + 1;
    let dailyTotal = 0;

    for (let s = 0; s < sessions; s++) {
      const duration = Math.floor(Math.random() * 40) + 15; // 15-55 minutes
      const song = userSongs[Math.floor(Math.random() * userSongs.length)];
      const note = notes[Math.floor(Math.random() * notes.length)];

      const hour = 8 + Math.floor(Math.random() * 12); // 8am-8pm
      const minute = Math.floor(Math.random() * 60);
      const startedAt = new Date(date);
      startedAt.setHours(hour, minute, 0, 0);
      const endedAt = new Date(startedAt);
      endedAt.setMinutes(endedAt.getMinutes() + duration);

      insertLog.run(
        userIds[i], user.instrument, duration, song, note,
        startedAt.toISOString(), endedAt.toISOString()
      );
      dailyTotal += duration;
    }

    const goalMet = dailyTotal >= user.daily_goal ? 1 : 0;
    insertCheckin.run(userIds[i], dateStr, dailyTotal, goalMet);
  }
}

console.log('  练习记录和打卡数据已生成');

// Create community posts
const insertPost = db.prepare(
  'INSERT INTO community_posts (user_id, type, title, content, instrument, song, likes) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const posts = [
  { userId: 1, type: '心得', title: '学钢琴一年的心路历程', content: '从零基础到现在能弹一些简单的曲子，虽然过程很艰辛，但每次进步都让我充满动力。最重要的是坚持每天练习，哪怕只有30分钟。', instrument: '钢琴', song: '', likes: 15 },
  { userId: 2, type: '推荐', title: '吉他入门必弹曲目推荐', content: '推荐几首适合初学者的吉他曲目：1. 小星星 - 简单的单音练习 2. Romanc - 经典指弹入门 3. 童年 - 和弦练习好选择。这些曲子难度循序渐进，非常适合初学者。', instrument: '吉他', song: 'Romance', likes: 23 },
  { userId: 3, type: '心得', title: '小提琴音准训练方法', content: '练小提琴最头疼的就是音准问题。我总结了几个方法：1. 多听标准音 2. 慢练，不要急 3. 录音回放对比 4. 使用调音器辅助。坚持了一个月，音准明显提高了。', instrument: '小提琴', song: '梁祝', likes: 18 },
  { userId: 4, type: '推荐', title: '架子鼓节奏感训练', content: '节奏感是架子鼓的灵魂。推荐从基础的四四拍开始，配合节拍器练习。推荐曲目：《光辉岁月》前奏部分非常适合练习基础节奏型。', instrument: '架子鼓', song: '光辉岁月', likes: 12 },
  { userId: 5, type: '心得', title: '如何克服演出紧张', content: '上周参加了学校音乐会，虽然紧张但还是顺利完成了。分享几点经验：1. 充分准备，比平时多练50% 2. 在人前多练习 3. 上台前深呼吸 4. 把注意力放在音乐上而不是观众。', instrument: '钢琴', song: '梦中的婚礼', likes: 30 },
  { userId: 2, type: '心得', title: '每天坚持练习的秘诀', content: '很多同学问我怎么坚持每天练琴。我的方法是：固定时间、固定地点、设定小目标。比如今天攻克一个小节，明天练习一个和弦转换。目标越小越好完成，完成就有成就感。', instrument: '吉他', song: '', likes: 42 },
  { userId: 3, type: '推荐', title: '适合练耳的古典音乐推荐', content: '练小提琴一定要多听古典音乐。推荐：1. 维瓦尔第《四季》- 旋律优美 2. 莫扎特小提琴协奏曲 - 古典优雅 3. 帕格尼尼随想曲 - 高级进阶。每天听30分钟，对音准和乐感都有帮助。', instrument: '小提琴', song: '四季-春', likes: 27 },
];

for (const p of posts) {
  insertPost.run(p.userId, p.type, p.title, p.content, p.instrument, p.song, p.likes);
}
console.log('  社区帖子已生成');

// Create some comments
const insertComment = db.prepare(
  'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)'
);
const comments = [
  { postId: 1, userId: 2, content: '太厉害了，一年就能弹这些曲子！' },
  { postId: 1, userId: 3, content: '同感，坚持最重要' },
  { postId: 2, userId: 5, content: '刚好在找入门曲目，收藏了' },
  { postId: 3, userId: 1, content: '音准确实是小提琴最难的部分' },
  { postId: 5, userId: 4, content: '演出紧张太正常了，多上台就好了' },
  { postId: 6, userId: 3, content: '固定时间练习这个建议很好' },
  { postId: 6, userId: 4, content: '目标拆小，这个方法我也试试' },
];

for (const c of comments) {
  insertComment.run(c.postId, c.userId, c.content);
}
console.log('  评论数据已生成');

console.log('\n测试数据初始化完成！');
console.log('测试账号：');
console.log('  admin / admin123 (管理员)');
console.log('  xiaoming / 123456');
console.log('  xiaohong / 123456');
console.log('  xiaogang / 123456');
console.log('  xiaoli / 123456');
