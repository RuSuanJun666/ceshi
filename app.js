class TournamentManager {
    constructor() {
        this.players = [];
        this.matches = [];
        this.standings = [];
        this.currentMode = 'singles';
        this.initialize();
    }
    
    initialize() {
        // DOM元素绑定
        this.elements = {
            singlesMode: document.getElementById('singlesMode'),
            doublesMode: document.getElementById('doublesMode'),
            batchPlayers: document.getElementById('batchPlayers'),
            batchAdd: document.getElementById('batchAdd'),
            singlePlayer: document.getElementById('singlePlayer'),
            addPlayer: document.getElementById('addPlayer'),
            clearPlayers: document.getElementById('clearPlayers'),
            playerList: document.getElementById('playerList'),
            playerCount: document.getElementById('playerCount'),
            rounds: document.getElementById('rounds'),
            totalMatches: document.getElementById('totalMatches'),
            generateMatches: document.getElementById('generateMatches'),
            filterPlayer: document.getElementById('filterPlayer'),
            resetFilter: document.getElementById('resetFilter'),
            matchesContainer: document.getElementById('matchesContainer'),
            standingsTable: document.getElementById('standingsTable').querySelector('tbody'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content')
        };
        
        // 事件监听
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 模式切换
        this.elements.singlesMode.addEventListener('click', () => this.switchMode('singles'));
        this.elements.doublesMode.addEventListener('click', () => this.switchMode('doubles'));
        
        // 选手管理
        this.elements.batchAdd.addEventListener('click', () => this.addBatchPlayers());
        this.elements.addPlayer.addEventListener('click', () => this.addSinglePlayer());
        this.elements.singlePlayer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addSinglePlayer();
        });
        this.elements.clearPlayers.addEventListener('click', () => this.clearPlayers());
        
        // 比赛生成
        this.elements.generateMatches.addEventListener('click', () => this.generateTournament());
        
        // 结果筛选
        this.elements.filterPlayer.addEventListener('input', () => this.filterResults());
        this.elements.resetFilter.addEventListener('click', () => this.resetFilter());
        
        // 标签切换
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        this.elements.singlesMode.classList.toggle('active', mode === 'singles');
        this.elements.doublesMode.classList.toggle('active', mode === 'doubles');
        this.updateRoundOptions();
    }
    
    addSinglePlayer() {
        const name = this.elements.singlePlayer.value.trim();
        if (name) {
            this.addPlayer(name);
            this.elements.singlePlayer.value = '';
        }
    }
    
    addBatchPlayers() {
        const text = this.elements.batchPlayers.value.trim();
        if (!text) return;
        
        // 支持多种分隔符
        const separators = ['\n', ',', '，', ';', '；'];
        let names = [text];
        
        separators.forEach(sep => {
            names = names.flatMap(item => item.split(sep));
        });
        
        names = names.map(name => name.trim()).filter(name => name);
        
        names.forEach(name => {
            this.addPlayer(name);
        });
        
        this.elements.batchPlayers.value = '';
    }
    
    addPlayer(name) {
        if (!name || this.players.includes(name)) return;
        
        this.players.push(name);
        this.renderPlayerList();
        this.updateRoundOptions();
    }
    
    removePlayer(index) {
        this.players.splice(index, 1);
        this.renderPlayerList();
        this.updateRoundOptions();
    }
    
    clearPlayers() {
        this.players = [];
        this.renderPlayerList();
        this.updateRoundOptions();
        this.clearResults();
    }
    
    renderPlayerList() {
        this.elements.playerList.innerHTML = '';
        this.players.forEach((player, index) => {
            const tag = document.createElement('div');
            tag.className = 'player-tag';
            tag.innerHTML = `
                ${player}
                <span class="remove" data-index="${index}">×</span>
            `;
            this.elements.playerList.appendChild(tag);
        });
        
        this.elements.playerCount.textContent = this.players.length;
        
        // 添加删除事件
        document.querySelectorAll('.player-tag .remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this.removePlayer(index);
            });
        });
        
        // 根据选手数量启用/禁用生成按钮
        this.elements.generateMatches.disabled = this.players.length < (this.currentMode === 'singles' ? 2 : 4);
    }
    
    updateRoundOptions() {
        const select = this.elements.rounds;
        select.innerHTML = '';
        
        if (this.players.length < (this.currentMode === 'singles' ? 2 : 4)) {
            select.disabled = true;
            select.innerHTML = '<option value="">请先添加选手</option>';
            this.elements.totalMatches.textContent = '0';
            return;
        }
        
        select.disabled = false;
        
        const playerCount = this.players.length;
        let options = [];
        
        if (this.currentMode === 'singles') {
            // 单打轮次选项
            const maxRounds = playerCount - 1;
            options.push({
                rounds: maxRounds,
                matches: playerCount * maxRounds / 2
            });
        } else {
            // 双打轮次选项
            if (playerCount % 2 === 0) {
                // 偶数选手
                const maxRounds = playerCount - 1;
                options.push({
                    rounds: maxRounds,
                    matches: playerCount * maxRounds / 4
                });
            } else {
                // 奇数选手特殊处理
                if (playerCount === 5) {
                    options.push(
                        { rounds: 2, matches: 5 },
                        { rounds: 4, matches: 10 }
                    );
                } else if (playerCount === 6) {
                    options.push(
                        { rounds: 4, matches: 6 },
                        { rounds: 6, matches: 9 },
                        { rounds: 10, matches: 15 }
                    );
                } else if (playerCount === 7) {
                    options.push(
                        { rounds: 4, matches: 7 },
                        { rounds: 8, matches: 14 },
                        { rounds: 12, matches: 21 }
                    );
                }
            }
        }
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.rounds;
            option.textContent = `每人${opt.rounds}场共${opt.matches}场`;
            select.appendChild(option);
        });
        
        // 默认选择第一个选项
        if (options.length > 0) {
            select.value = options[0].rounds;
            this.elements.totalMatches.textContent = options[0].matches;
        }
    }
    
    generateTournament() {
        const rounds = parseInt(this.elements.rounds.value);
        
        if (this.currentMode === 'singles') {
            this.matches = ovo.generateSinglesMatches(this.players, rounds);
        } else {
            this.matches = tvt.generateDoublesMatches(this.players, rounds);
        }
        
        this.renderMatches();
        this.calculateStandings();
        this.renderStandings();
    }
    
    renderMatches() {
        this.elements.matchesContainer.innerHTML = '';
        
        // 按轮次分组
        const matchesByRound = {};
        this.matches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });
        
        // 渲染每轮比赛
        Object.entries(matchesByRound).forEach(([round, matches]) => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'match-day';
            dayDiv.innerHTML = `
                <div class="day-header">第 ${round} 轮</div>
                <div class="matches-grid"></div>
            `;
            
            const grid = dayDiv.querySelector('.matches-grid');
            
            matches.forEach((match, index) => {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                matchCard.innerHTML = `
                    <h4>比赛 ${index + 1}</h4>
                    <div class="players">
                        <div class="player">${match.player1}</div>
                        <div class="vs">VS</div>
                        <div class="player">${match.player2}</div>
                    </div>
                `;
                grid.appendChild(matchCard);
            });
            
            this.elements.matchesContainer.appendChild(dayDiv);
        });
    }
    
    calculateStandings() {
        // 初始化积分榜
        this.standings = this.players.map(player => ({
            player,
            wins: 0,
            losses: 0,
            points: 0
        }));
        
        // TODO: 实际比赛结果统计逻辑
        // 这里需要根据实际比赛结果更新积分榜
    }
    
    renderStandings() {
        this.elements.standingsTable.innerHTML = '';
        
        this.standings.forEach((standing, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${standing.player}</td>
                <td>${standing.wins}</td>
                <td>${standing.losses}</td>
                <td>${standing.points}</td>
            `;
            this.elements.standingsTable.appendChild(row);
        });
    }
    
    filterResults() {
        const filter = this.elements.filterPlayer.value.toLowerCase();
        if (!filter) return;
        
        // 筛选对阵表
        document.querySelectorAll('.match-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(filter) ? 'block' : 'none';
        });
        
        // 筛选积分榜
        const rows = this.elements.standingsTable.querySelectorAll('tr');
        rows.forEach(row => {
            const player = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            row.style.display = player.includes(filter) ? 'table-row' : 'none';
        });
    }
    
    resetFilter() {
        this.elements.filterPlayer.value = '';
        document.querySelectorAll('.match-card').forEach(card => {
            card.style.display = 'block';
        });
        this.elements.standingsTable.querySelectorAll('tr').forEach(row => {
            row.style.display = 'table-row';
        });
    }
    
    clearResults() {
        this.matches = [];
        this.standings = [];
        this.elements.matchesContainer.innerHTML = '';
        this.elements.standingsTable.innerHTML = '';
    }
    
    switchTab(tabId) {
        // 更新按钮状态
        this.elements.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // 更新内容显示
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}Tab`);
        });
    }
}

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    const tournament = new TournamentManager();
});