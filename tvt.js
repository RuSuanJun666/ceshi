// 双打比赛编排系统
class TeamVsTeam {
    constructor() {
        this.players = [];
        this.matches = [];
        this.currentRound = 1;
        this.mode = 'singles';
        this.playerMatches = new Map(); // 记录每个选手的比赛次数
        this.playerLastMatch = new Map(); // 记录每个选手最后一场比赛的编号
    }

    init(players, mode = 'singles') {
        this.players = [...players];
        this.matches = [];
        this.currentRound = 1;
        this.mode = mode;
        this.playerMatches = new Map();
        this.playerLastMatch = new Map();
        
        // 初始化比赛次数和最后参赛场次
        this.players.forEach(player => {
            this.playerMatches.set(player.id, 0);
            this.playerLastMatch.set(player.id, -1); // -1表示还没有参赛
        });
    }

    // 生成双打比赛场次
    generateDoubleMatches(rounds = 1) {
        const playerCount = this.players.length;
        if (playerCount < 4) return false;

        // 清空之前的比赛
        this.matches = [];
        
        // 根据不同人数调用不同的生成函数
        switch (playerCount) {
            case 4:
                return this.generateFourPlayerMatches(rounds);
            case 5:
                // 5人特殊处理：rounds=2生成5场比赛，rounds=4生成10场比赛
                if (rounds === 2) {
                    return this.generateFivePlayerMatches(2); // 每人2场，共5场
                } else if (rounds === 4) {
                    return this.generateFivePlayerMatches(4); // 每人4场，共10场
                }
                return this.generateFlexibleMatches(rounds, 1);
            case 6:
                // 6人特殊处理：根据rounds选择合适的每人场次
                if (rounds === 4) {
                    return this.generateFlexibleMatches(2, 1); // 每人2场，共6场
                } else if (rounds === 6) {
                    return this.generateFlexibleMatches(3, 1); // 每人3场，共9场
                } else if (rounds === 10) {
                    return this.generateFlexibleMatches(5, 1); // 每人5场，共15场
                }
                return this.generateFlexibleMatches(rounds, 1);
            case 7:
                // 7人特殊处理：根据rounds选择合适的每人场次
                if (rounds === 4) {
                    return this.generateFlexibleMatches(2, 1); // 每人2场，共7场
                } else if (rounds === 8) {
                    return this.generateFlexibleMatches(4, 1); // 每人4场，共14场
                } else if (rounds === 12) {
                    return this.generateFlexibleMatches(6, 1); // 每人6场，共21场
                }
                return this.generateFlexibleMatches(rounds, 1);
            default:
                // 其他人数使用通用算法
                let matchesPerPlayer;
                if (playerCount <= 7) {
                    matchesPerPlayer = 4; // 5-7人时每人4场
                } else {
                    matchesPerPlayer = 8; // 8人及以上每人8场
                }
                return this.generateFlexibleMatches(matchesPerPlayer, 1);
        }
    }

    // 通用灵活对阵表生成算法
    generateFlexibleMatches(matchesPerPlayer, rounds = 1) {
        const players = [...this.players];
        const playerCount = players.length;
        
        // 计算总场次
        const totalMatches = Math.ceil((playerCount * matchesPerPlayer) / 4);
        
        for (let round = 1; round <= rounds; round++) {
            // 每轮开始前随机打乱选手顺序
            this.shuffleArray(players);
            
            // 生成所有可能的双人组合
            const allPairs = this.generateAllPairs(players);
            
            // 记录每个选手的参与场次
            const playerParticipation = new Map();
            players.forEach(player => {
                playerParticipation.set(player.id, 0);
            });
            
            // 记录每场比赛的间隔
            const matchGaps = new Map();
            players.forEach(player => {
                matchGaps.set(player.id, 0);
            });
            
            // 生成对阵表
            for (let matchIndex = 0; matchIndex < totalMatches; matchIndex++) {
                // 找出最适合的两对选手进行比赛
                const matchPairs = this.findBestMatchPairs(allPairs, playerParticipation, matchesPerPlayer, matchGaps, matchIndex);
                
                if (matchPairs.length === 2) {
                    const team1 = matchPairs[0];
                    const team2 = matchPairs[1];
                    
                    // 创建比赛
                    this.matches.push({
                        id: this.matches.length,
                        round: matchIndex + 1 + (round - 1) * totalMatches,
                        players: `${team1[0].name}/${team1[1].name} VS ${team2[0].name}/${team2[1].name}`,
                        team1: team1,
                        team2: team2,
                        score: '-',
                        played: false
                    });
                    
                    // 更新比赛次数和最后参赛场次
                    [...team1, ...team2].forEach(player => {
                        // 更新参与场次
                        playerParticipation.set(player.id, playerParticipation.get(player.id) + 1);
                        
                        // 更新总比赛次数
                        this.playerMatches.set(player.id, 
                            (this.playerMatches.get(player.id) || 0) + 1);
                        
                        // 更新最后参赛场次
                        const lastMatch = this.playerLastMatch.get(player.id);
                        if (lastMatch !== -1) {
                            matchGaps.set(player.id, matchIndex - lastMatch);
                        }
                        this.playerLastMatch.set(player.id, matchIndex);
                    });
                }
            }
        }
        
        return true;
    }

    // 生成所有可能的双人组合
    generateAllPairs(players) {
        const pairs = [];
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                pairs.push([players[i], players[j]]);
            }
        }
        return pairs;
    }

    // 找出最适合的两对选手进行比赛
    findBestMatchPairs(allPairs, playerParticipation, matchesPerPlayer, matchGaps, currentMatchIndex) {
        // 过滤出可用的组合（没有达到场次上限的选手）
        const availablePairs = allPairs.filter(pair => 
            playerParticipation.get(pair[0].id) < matchesPerPlayer &&
            playerParticipation.get(pair[1].id) < matchesPerPlayer
        );
        
        if (availablePairs.length < 2) return [];
        
        // 计算每对选手的得分（优先选择参与场次少的和休息时间长的选手）
        const pairScores = new Map();
        availablePairs.forEach(pair => {
            const player1 = pair[0];
            const player2 = pair[1];
            
            // 参与场次得分（场次越少得分越高）
            const participationScore = 
                (matchesPerPlayer - playerParticipation.get(player1.id)) +
                (matchesPerPlayer - playerParticipation.get(player2.id));
            
            // 休息时间得分（休息时间越长得分越高）
            const restScore = 
                (matchGaps.get(player1.id) || 0) +
                (matchGaps.get(player2.id) || 0);
            
            // 总得分（加权平均）
            const totalScore = participationScore * 2 + restScore;
            
            pairScores.set(pair, totalScore);
        });
        
        // 按得分排序
        const sortedPairs = [...availablePairs].sort((a, b) => 
            pairScores.get(b) - pairScores.get(a)
        );
        
        // 选择得分最高的两对，确保没有重复选手
        const selectedPairs = [];
        const usedPlayers = new Set();
        
        for (const pair of sortedPairs) {
            if (usedPlayers.has(pair[0].id) || usedPlayers.has(pair[1].id)) {
                continue;
            }
            
            selectedPairs.push(pair);
            usedPlayers.add(pair[0].id);
            usedPlayers.add(pair[1].id);
            
            if (selectedPairs.length === 2) {
                break;
            }
        }
        
        return selectedPairs;
    }

    // 专门处理4人双打的情况
    generateFourPlayerMatches(rounds) {
        const players = [...this.players];
        // 4人双打只有3种组合
        const standardMatches = [
            [[0,1], [2,3]],
            [[0,2], [1,3]],
            [[0,3], [1,2]]
        ];

        for (let round = 1; round <= rounds; round++) {
            // 每轮开始前随机打乱选手顺序
            this.shuffleArray(players);
            
            standardMatches.forEach((matchPair, index) => {
                const [[p1, p2], [p3, p4]] = matchPair;
                const team1 = [players[p1], players[p2]];
                const team2 = [players[p3], players[p4]];
                
                this.matches.push({
                    id: this.matches.length,
                    round: index + 1 + (round - 1) * 3, // 每轮3场比赛
                    players: `${team1[0].name}/${team1[1].name} VS ${team2[0].name}/${team2[1].name}`,
                    team1: team1,
                    team2: team2,
                    score: '-',
                    played: false
                });

                // 更新比赛次数
                [...team1, ...team2].forEach(player => {
                    this.playerMatches.set(player.id, 
                        (this.playerMatches.get(player.id) || 0) + 1);
                });
            });
        }
        
        return true;
    }
    
    // 专门处理5人双打的情况
    generateFivePlayerMatches(matchesPerPlayer) {
        const players = [...this.players];
        // 5人双打的特殊处理
        
        // 随机打乱选手顺序
        this.shuffleArray(players);
        
        // 根据每人场次选择合适的对阵表
        if (matchesPerPlayer === 2) {
            // 5人每人2场，共5场比赛的对阵表
            const matchPairs = [
                [[0,1], [2,3]], // A/B vs C/D (E轮空)
                [[0,2], [3,4]], // A/C vs D/E (B轮空)
                [[0,4], [1,3]], // A/E vs B/D (C轮空)
                [[1,4], [2,3]], // B/E vs C/D (A轮空)
                [[0,3], [1,2]]  // A/D vs B/C (E轮空)
            ];
            
            matchPairs.forEach((matchPair, index) => {
                const [[p1, p2], [p3, p4]] = matchPair;
                const team1 = [players[p1], players[p2]];
                const team2 = [players[p3], players[p4]];
                
                this.matches.push({
                    id: this.matches.length,
                    round: index + 1, // 每场比赛为一轮
                    players: `${team1[0].name}/${team1[1].name} VS ${team2[0].name}/${team2[1].name}`,
                    team1: team1,
                    team2: team2,
                    score: '-',
                    played: false
                });
                
                // 更新比赛次数
                [...team1, ...team2].forEach(player => {
                    this.playerMatches.set(player.id, 
                        (this.playerMatches.get(player.id) || 0) + 1);
                });
            });
        } else if (matchesPerPlayer === 4) {
            // 5人每人4场，共10场比赛的对阵表
            // 这里我们执行上面的5场比赛两次，但重新洗牌选手以确保不同的组合
            for (let round = 0; round < 2; round++) {
                // 每轮开始前随机打乱选手顺序
                if (round > 0) this.shuffleArray(players);
                
                const matchPairs = [
                    [[0,1], [2,3]], // 第一轮
                    [[0,2], [3,4]],
                    [[0,4], [1,3]],
                    [[1,4], [2,3]],
                    [[0,3], [1,2]]
                ];
                
                matchPairs.forEach((matchPair, index) => {
                    const [[p1, p2], [p3, p4]] = matchPair;
                    const team1 = [players[p1], players[p2]];
                    const team2 = [players[p3], players[p4]];
                    
                    this.matches.push({
                        id: this.matches.length,
                        round: index + 1 + round * 5, // 计算实际轮次
                        players: `${team1[0].name}/${team1[1].name} VS ${team2[0].name}/${team2[1].name}`,
                        team1: team1,
                        team2: team2,
                        score: '-',
                        played: false
                    });
                    
                    // 更新比赛次数
                    [...team1, ...team2].forEach(player => {
                        this.playerMatches.set(player.id, 
                            (this.playerMatches.get(player.id) || 0) + 1);
                    });
                });
            }
        }
        
        return true;
    }

    // 计算基础场次
    calculateBaseMatches(playerCount) {
        if (playerCount < 4) return 0;
        
        if (playerCount === 4) {
            return 3; // 4人共3场（每人3场）
        } else if (playerCount <= 7) {
            // 5-7人每人4场
            return Math.ceil((playerCount * 4) / 4);
        } else {
            // 8人及以上每人8场
            return Math.ceil((playerCount * 8) / 4);
        }
    }

    // 工具函数：随机打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 记录比分
    recordScore(matchId, score) {
        const match = this.matches.find(m => m.id === parseInt(matchId));
        if (!match) return false;
        match.score = score;
        match.played = true;
        return true;
    }

    // 获取对阵表
    getMatchesTable() {
        return this.matches;
    }

    // 获取积分榜
    getStandings() {
        let standings = new Map();

        // 初始化所有选手的战绩
        this.players.forEach(player => {
            standings.set(player.id, {
                player: player,
                wins: 0,
                points: 0,
                matches: 0
            });
        });

        // 统计每场比赛的结果
        this.matches.forEach(match => {
            if (!match.played) return;

            const [score1, score2] = match.score.split('-').map(Number);
            const team1Players = match.team1;
            const team2Players = match.team2;

            // 更新参赛场次
            team1Players.concat(team2Players).forEach(player => {
                let stats = standings.get(player.id);
                stats.matches++;
            });

            // 更新胜场和得分
            if (score1 > score2) {
                team1Players.forEach(player => {
                    let stats = standings.get(player.id);
                    stats.wins++;
                    stats.points += score1;
                });
                team2Players.forEach(player => {
                    let stats = standings.get(player.id);
                    stats.points += score2;
                });
            } else {
                team2Players.forEach(player => {
                    let stats = standings.get(player.id);
                    stats.wins++;
                    stats.points += score2;
                });
                team1Players.forEach(player => {
                    let stats = standings.get(player.id);
                    stats.points += score1;
                });
            }
        });

        // 转换为数组并排序
        return Array.from(standings.values()).sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            if (b.points !== a.points) return b.points - a.points;
            return a.player.name.localeCompare(b.player.name);
        });
    }
}

// 创建全局实例
window.tvt = new TeamVsTeam();

// 添加公开API
window.tvt.generateDoublesMatches = function(players, rounds) {
    // 将普通玩家数组转换为带id的player对象数组
    const playerObjects = players.map((name, index) => ({
        id: index.toString(),
        name: name
    }));
    
    // 初始化
    this.init(playerObjects, 'doubles');
    
    // 生成比赛
    const result = this.generateDoubleMatches(rounds);
    
    // 转换格式以适配app.js的预期格式
    return this.matches.map(match => {
        return {
            round: match.round,
            player1: `${match.team1[0].name}/${match.team1[1].name}`,
            player2: `${match.team2[0].name}/${match.team2[1].name}`
        };
    });
};