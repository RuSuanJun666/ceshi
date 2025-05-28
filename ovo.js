/**
 * 智能单打比赛系统
 * 支持动态轮次设置和比分记录
 */
const ovo = (function() {
  let players = [];
  let matches = [];
  let standings = {};
  
  // 初始化系统
  function init(participants) {
    players = [...participants];
    standings = {};
    players.forEach(p => {
      standings[p.id] = { 
        player: p, 
        wins: 0, 
        points: 0,
        matches: 0 
      };
    });
  }

  // 生成唯一对阵组合（使用贝格尔轮转法）
  function generateUniqueMatches(rounds = 1) {
    const n = players.length;
    matches = [];
    
    // 如果是奇数人数，添加一个轮空选手
    const actualPlayers = [...players];
    if (n % 2 !== 0) {
        actualPlayers.push({ id: 'bye', name: '轮空' });
    }
    
    const totalPlayers = actualPlayers.length;
    const totalRounds = totalPlayers - 1; // 一个循环需要的轮次数
    
    // 生成每个循环的对阵
    for (let cycle = 0; cycle < rounds; cycle++) {
        const cyclePlayers = [...actualPlayers]; // 每个循环开始时重新复制选手列表
        
        // 生成这个循环的所有轮次
        for (let round = 0; round < totalRounds; round++) {
            // 使用贝格尔轮转法生成本轮对阵
            for (let i = 0; i < totalPlayers / 2; i++) {
                const player1 = cyclePlayers[i];
                const player2 = cyclePlayers[totalPlayers - 1 - i];
                
                // 跳过轮空的比赛
                if (player1.id !== 'bye' && player2.id !== 'bye') {
                    matches.push({
                        player1,
                        player2,
                        round: round + 1 + cycle * totalRounds, // 计算实际轮次
          played: false,
                        score: null,
                        id: `${player1.id}_${player2.id}_r${round + 1}_c${cycle + 1}`
        });
      }
    }

            // 轮转选手（保持第一个位置不变，其他位置顺时针轮转）
            const temp = cyclePlayers[totalPlayers - 1];
            for (let i = totalPlayers - 1; i > 1; i--) {
                cyclePlayers[i] = cyclePlayers[i - 1];
            }
            cyclePlayers[1] = temp;
        }
    }
    
    // 打乱每轮内的比赛顺序，但保持轮次不变
    const matchesByRound = {};
    matches.forEach(match => {
        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push(match);
    });
    
    // 打乱每轮内的比赛顺序
    Object.values(matchesByRound).forEach(roundMatches => {
        for (let i = roundMatches.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roundMatches[i], roundMatches[j]] = [roundMatches[j], roundMatches[i]];
        }
    });
    
    // 重新组合所有比赛
    matches = Object.values(matchesByRound).flat();
    
    return matches;
  }

  // 获取动态轮次选项
  function getRoundOptions() {
    const n = players.length;
    // 如果是奇数人数，需要加1来计算
    const totalPlayers = n % 2 === 0 ? n : n + 1;
    const matchesPerRound = Math.floor(totalPlayers / 2);
    const totalRounds = totalPlayers - 1; // 每个选手需要和其他所有选手各打一场

    return [
        { value: 1, label: `单循环（每人${totalRounds}场，共${matchesPerRound * totalRounds}场）` },
        { value: 2, label: `双循环（每人${totalRounds * 2}场，共${matchesPerRound * totalRounds * 2}场）` },
        { value: 3, label: `三循环（每人${totalRounds * 3}场，共${matchesPerRound * totalRounds * 3}场）` }
    ];
  }

  // 记录比分
  function recordScore(matchId, score) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return false;

    match.score = score;
    match.played = true;
    
    // 更新积分榜
    const [p1Score, p2Score] = score.split('-').map(Number);
    standings[match.player1.id].points += p1Score;
    standings[match.player2.id].points += p2Score;
    
    if (p1Score > p2Score) {
      standings[match.player1.id].wins++;
    } else {
      standings[match.player2.id].wins++;
    }
    
    standings[match.player1.id].matches++;
    standings[match.player2.id].matches++;
    
    return true;
  }

  // 获取当前对阵表（简化版）
  function getMatchesTable() {
    return matches.map(m => ({
      id: m.id,
      players: `${m.player1.name} VS ${m.player2.name}`,
      round: m.round,
      score: m.score || '-',
      played: m.played
    }));
  }

  // 获取积分榜
  function getStandings() {
    return Object.values(standings)
      .sort((a, b) => b.wins - a.wins || b.points - a.points);
  }

  return {
    init,
    generateUniqueMatches,
    getRoundOptions,
    recordScore,
    getMatchesTable,
    getStandings
  };
})();