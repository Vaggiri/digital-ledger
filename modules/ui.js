import { State } from './state.js';
import { Charts } from './charts.js';

export const UI = {
    appContainer: document.getElementById('app-container'),

    // Helper to clear container and set new content with animation
    transitionToHTML(htmlContent, callback) {
        gsap.to('#app-container', {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.appContainer.innerHTML = htmlContent;
                if (callback) callback();
                gsap.to('#app-container', { opacity: 1, duration: 0.3 });
            }
        });
    },

    showRegister() {
        const html = `
            <div class="screen active-screen" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100vh;">
                <!-- Step 1: Name -->
                <div id="step-1" style="width: 90%; max-width: 350px;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 10px; background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Hello.</h1>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">Let's get to know you.</p>
                    
                    <div style="margin-bottom: 30px;">
                         <input type="text" id="reg-name" placeholder="What should we call you?" required style="text-align: center; font-size: 1.2rem;">
                    </div>

                    <button id="btn-next" class="btn-primary" style="width: 100%;">Continue</button>
                </div>

                <!-- Step 2: PIN (Keypad) -->
                <div id="step-2" style="display:none; text-align: center;">
                    <h2 style="margin-bottom: 20px;">Create a PIN</h2>
                    
                    <div class="pin-display">
                        <div class="pin-dot"></div>
                        <div class="pin-dot"></div>
                        <div class="pin-dot"></div>
                        <div class="pin-dot"></div>
                    </div>

                    <div style="margin-top:20px;">
                        ${this.renderKeypad()}
                    </div>
                </div>
            </div>
        `;

        this.transitionToHTML(html, () => {
            const nameInput = document.getElementById('reg-name');
            const nextBtn = document.getElementById('btn-next');

            nextBtn.onclick = () => {
                if (nameInput.value.trim().length > 0) {
                    // Go to Step 2
                    gsap.to('#step-1', {
                        opacity: 0, x: -50, duration: 0.3, onComplete: () => {
                            document.getElementById('step-1').style.display = 'none';
                            const s2 = document.getElementById('step-2');
                            s2.style.display = 'block';
                            gsap.from(s2, { opacity: 0, x: 50, duration: 0.3 });

                            // Bind Keypad
                            this.bindKeypad((pin) => {
                                const name = nameInput.value.trim();
                                // Use Auth module properly
                                // We need to dispatch or call Auth. But UI shouldn't depend on Auth ideally, 
                                // but app.js handles events. Let's dispatch.
                                document.dispatchEvent(new CustomEvent('app:register', { detail: { name, pin } }));
                            });
                        }
                    });
                }
            };
        });
    },

    showLogin(userName) {
        // userName passed from app.js (user.name)
        const html = `
            <div class="screen active-screen" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100vh;">
                <div style="margin-bottom: 30px;">
                    <h1 style="font-size: 2rem; margin-bottom: 10px;">Welcome Back,</h1>
                    <h2 style="font-size: 1.8rem; color: var(--primary-color);">${userName}</h2>
                </div>
                
                <p style="color: var(--text-muted); margin-bottom: 20px;">Enter your PIN</p>
                
                <div id="pin-display" class="pin-display">
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                </div>

                <!-- Keypad Container -->
                <div id="keypad-container" style="margin-top: 20px;">
                    ${this.renderKeypad()}
                </div>
            </div>
        `;

        this.transitionToHTML(html, () => {
            this.bindKeypad((pin) => {
                // Dispatch login event
                document.dispatchEvent(new CustomEvent('app:login', { detail: { pin } }));
                // We don't return here. If login fails, app.js will call showLogin again or we need a way to shake.
                // Ideally app.js should handle failure visual. 
                // For now, let's assume if this callback is called, we wait. 
                // If app.js detects wrong pin, it calls showLogin again or we can listen for 'login-failed' event?
                // Let's implement a simple error shake if logic stays here? No, Logic is in app.js.
                // We can simply return.
            });

            // Listen for failure (Hack for now, or just let app.js re-render which shakes)
        });
    },

    showDashboard(user) {
        const data = State.getData();
        const total = data.balance.hand + data.balance.bank;
        const spendingData = State.getSpendingByTag();
        const hasSpending = Object.keys(spendingData).length > 0;

        // Greeting Logic
        const hour = new Date().getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else if (hour >= 17) greeting = 'Good Evening';

        const html = `
            <div class="screen active-screen" style="padding-bottom: 100px; height: 100vh; overflow-y: scroll;">
                <!-- Header -->
                <header style="padding: 25px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                         <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2px;">${greeting},</p>
                        <h2 style="font-weight: 700; color: var(--primary-color); fontSize: 1.5rem;">${user.name}</h2>
                    </div>
                    <div id="btn-profile" style="background: var(--bg-gradient-1); padding: 10px; border-radius: 50%; border: 1px solid var(--primary-color); cursor: pointer;">
                        <i class="ri-user-3-fill" style="font-size: 1.2rem; color: var(--primary-color);"></i>
                    </div>
                </header>

                <!-- Balance Cards -->
                <div style="padding: 0 20px;">
                    <div class="glass-panel" style="padding: 25px; margin-bottom: 25px; position: relative; overflow: hidden;">
                        <!-- Decroative glow -->
                        <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: var(--primary-color); filter: blur(60px); opacity: 0.3;"></div>
                        
                        <p style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Total Balance</p>
                        <h1 style="font-size: 3rem; margin: 10px 0; font-weight: 700;">₹${total.toFixed(2)}</h1>
                        
                        <div style="display: flex; gap: 20px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--glass-border);">
                            <div style="flex: 1;">
                                <span style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 5px;">
                                    <i class="ri-wallet-3-fill" style="color: var(--accent-color);"></i> In Hand
                                </span>
                                <div style="font-weight: 600; font-size: 1.1rem; margin-top: 5px;">₹${data.balance.hand.toFixed(2)}</div>
                            </div>
                            <div style="width: 1px; background: var(--glass-border);"></div>
                            <div style="flex: 1;">
                                <span style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 5px;">
                                    <i class="ri-bank-fill" style="color: var(--secondary-color);"></i> Bank
                                </span>
                                <div style="font-weight: 600; font-size: 1.1rem; margin-top: 5px;">₹${data.balance.bank.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions Grid -->
                <div style="padding: 0 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px;">
                    <button id="btn-add-credit" class="glass-panel" style="padding: 15px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="ri-arrow-down-line" style="font-size: 1.5rem; color: var(--success);"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">Credit</span>
                    </button>
                    <button id="btn-add-debit" class="glass-panel" style="padding: 15px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="ri-arrow-up-line" style="font-size: 1.5rem; color: var(--danger);"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">Debit</span>
                    </button>
                     <button id="btn-lend" class="glass-panel" style="padding: 15px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="ri-exchange-dollar-line" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">Loan</span>
                    </button>
                     <button id="btn-history" class="glass-panel" style="padding: 15px 5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <i class="ri-file-list-3-line" style="font-size: 1.5rem; color: var(--text-main);"></i>
                        <span style="font-size: 0.75rem; font-weight: 600;">History</span>
                    </button>
                </div>

                <!-- Infographics -->
                <div style="padding: 0 20px; margin-bottom: 30px;">
                    <h3 style="margin-bottom: 15px; font-size: 1.1rem;">Expenses Analysis</h3>
                    <div class="glass-panel" style="padding: 20px; height: 220px;">
                        ${hasSpending ? '<canvas id="spending-chart"></canvas>' : '<div style="height:100%; display:flex; justify-content:center; align-items:center; color:var(--text-muted);">No expenses recorded yet.</div>'}
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div style="padding: 0 20px;">
                    <h3 style="margin-bottom: 15px; font-size: 1.1rem;">Recent Activity</h3>
                    <div id="recent-list">
                        ${this.renderTransactionList(data.transactions.slice(0, 10), true)}
                    </div>
                </div>
            </div>
            
            <!-- Settle Modal (Hidden by default) -->
            <div id="settle-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:100; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); justify-content:center; align-items:center;">
                 <div class="glass-panel" style="padding: 25px; width: 90%; max-width: 350px;">
                    <h3 style="margin-bottom: 10px;">Settle Transaction</h3>
                    <p id="settle-msg" style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.9rem;"></p>
                    
                    <label style="display: block; margin-bottom: 10px; font-size: 0.9rem;">Select Payment Mode:</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        <button id="settle-hand" class="glass-panel" style="padding: 10px; font-size: 0.9rem;">Cash</button>
                        <button id="settle-bank" class="glass-panel" style="padding: 10px; font-size: 0.9rem;">Bank</button>
                    </div>
                    <button id="settle-cancel" style="width: 100%; background: transparent; color: var(--text-muted); padding: 10px;">Cancel</button>
                 </div>
            </div>
        `;

        this.transitionToHTML(html, () => {
            // Render Chart
            if (hasSpending) {
                Charts.renderSpending('spending-chart', spendingData);
            }

            // Bind Actions
            document.getElementById('btn-add-credit').onclick = () => this.showTransactionForm('credit');
            document.getElementById('btn-add-debit').onclick = () => this.showTransactionForm('debit');
            document.getElementById('btn-lend').onclick = () => this.showLendForm();
            document.getElementById('btn-profile').onclick = () => this.showProfileModal(data.user);
            document.getElementById('btn-history').onclick = () => this.showHistoryScreen();

            // Bind Settle Buttons & Edit Click (Delegation)
            const list = document.getElementById('recent-list');
            list.addEventListener('click', (e) => {
                if (e.target.closest('.btn-settle')) {
                    e.stopPropagation(); // Don't trigger edit
                    const btn = e.target.closest('.btn-settle');
                    const id = btn.dataset.id;
                    const type = btn.dataset.type;
                    const amount = btn.dataset.amount;
                    this.openSettleModal(id, type, amount);
                } else if (e.target.closest('.transaction-item')) {
                    const el = e.target.closest('.transaction-item');
                    const id = el.dataset.id;
                    const type = el.dataset.type;

                    if (type === 'credit' || type === 'debit') {
                        this.showEditForm(id, type);
                    }
                }
            });
        });
    },

    openSettleModal(id, type, amount) {
        const modal = document.getElementById('settle-modal');
        const msg = document.getElementById('settle-msg');

        modal.style.display = 'flex';
        gsap.fromTo(modal.firstElementChild, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 });

        const isLend = type === 'lend';
        msg.textContent = isLend
            ? `Receiving ₹${amount} back.`
            : `Paying back ₹${amount}.`;

        const handleSettle = (mode) => {
            const success = State.settleTransaction(id, mode);
            if (success) {
                const data = State.getData();
                this.showDashboard(data.user); // Refresh
            }
        };

        const handBtn = document.getElementById('settle-hand');
        const bankBtn = document.getElementById('settle-bank');
        const cancelBtn = document.getElementById('settle-cancel');

        // Clean previous listeners by cloning or just assigning new onClick
        handBtn.onclick = () => handleSettle('hand');
        bankBtn.onclick = () => handleSettle('bank');
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
    },

    renderTransactionList(transactions, allowSettle = false) {
        if (transactions.length === 0) return '<div style="text-align:center; color: var(--text-muted); padding: 20px;">No transactions found.</div>';

        return transactions.map(t => {
            const isSettled = t.status === 'settled';
            const isLoan = t.type === 'lend' || t.type === 'borrow';

            let iconColor = 'var(--text-muted)';
            let sign = '';

            if (t.type === 'credit') { iconColor = 'var(--success)'; sign = '+'; }
            else if (t.type === 'debit') { iconColor = 'var(--danger)'; sign = '-'; }
            else if (t.type === 'lend') { iconColor = 'var(--accent-color)'; sign = '-'; } // Money left me
            else if (t.type === 'borrow') { iconColor = 'var(--secondary-color)'; sign = '+'; } // Money came to me

            return `
            <div class="glass-panel" style="padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden; ${isSettled ? 'opacity: 0.6;' : ''}">
                ${isSettled ? '<div style="position: absolute; right: -15px; top: 10px; background: var(--success); color: #000; font-size: 0.6rem; padding: 2px 20px; transform: rotate(45deg); font-weight: 700;">PAID</div>' : ''}
                
                <div class="transaction-item" data-id="${t.id}" data-type="${t.type}" style="cursor: pointer; display: flex; align-items: center; gap: 15px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 14px; color: ${iconColor};">
                        <i class="${this.getIconForType(t.type)}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 2px;">${t.desc || (t.person ? `${t.type === 'lend' ? 'Lent to' : 'Borrowed from'} ${t.person}` : t.type.toUpperCase())}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">
                            ${new Date(t.date).toLocaleDateString()} • ${t.mode} ${t.person ? '• ' + t.person : ''}
                        </div>
                    </div>
                     <div style="text-align: right;">
                        <div style="font-weight: 700; font-size: 1rem; color: ${iconColor}; margin-bottom: 4px;">
                            ${sign}₹${parseFloat(t.amount).toFixed(2)}
                        </div>
                        ${(isLoan && !isSettled && allowSettle) ? `
                            <button class="btn-settle" data-id="${t.id}" data-type="${t.type}" data-amount="${t.amount}" style="font-size: 0.7rem; background: var(--glass-border); padding: 5px 12px; border-radius: 8px; color: var(--text-main); margin-top: 5px;">
                                ${t.type === 'lend' ? 'Receive' : 'Pay'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `}).join('');
    },

    getIconForType(type) {
        switch (type) {
            case 'credit': return 'ri-arrow-down-line';
            case 'debit': return 'ri-arrow-up-line';
            case 'lend': return 'ri-hand-coin-line';
            case 'borrow': return 'ri-hand-heart-line';
            default: return 'ri-file-list-line';
        }
    },

    showTransactionForm(type) {
        const isCredit = type === 'credit';
        const html = `
             <div class="screen active-screen" style="display: flex; flex-direction: column; height: 100%;">
                <header style="padding: 20px; display: flex; align-items: center; gap: 15px;">
                    <button id="btn-back" style="font-size: 1.5rem; color: var(--text-main); background: transparent;"><i class="ri-arrow-left-line"></i></button>
                    <h2 style="font-size: 1.2rem;">New ${isCredit ? 'Credit' : 'Debit'}</h2>
                </header>
                
                <div style="flex: 1; padding: 0 20px; overflow-y: auto;">
                    <form id="trans-form">
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Amount</label>
                            <div class="glass-panel" style="padding: 10px; display:flex; align-items: center;">
                                <span style="font-size: 1.5rem; margin-right: 10px; color: var(--text-muted);">₹</span>
                                <input type="number" id="t-amount" placeholder="0" required style="font-size: 2rem; font-weight: 700; color: var(--text-main); background: transparent; border: none; padding: 0; margin: 0;">
                            </div>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Payment Mode</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                 <label class="glass-panel" style="padding: 15px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="mode" value="hand" checked style="display: none;">
                                    <i class="ri-wallet-3-fill" style="font-size: 1.5rem; margin-bottom: 8px; display: block; color: var(--accent-color);"></i>
                                    <span style="font-size: 0.9rem;">Cash</span>
                                </label>
                                <label class="glass-panel" style="padding: 15px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="mode" value="bank" style="display: none;">
                                    <i class="ri-bank-fill" style="font-size: 1.5rem; margin-bottom: 8px; display: block; color: var(--secondary-color);"></i>
                                    <span style="font-size: 0.9rem;">Bank</span>
                                </label>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Description</label>
                            <input type="text" id="t-desc" placeholder="Note..." required>
                        </div>

                        ${!isCredit ? `
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Category</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                                <label class="cat-chip glass-panel" style="padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;">
                                    <input type="radio" name="tags" value="food" checked style="display:none;"> Food
                                </label>
                                <label class="cat-chip glass-panel" style="padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;">
                                    <input type="radio" name="tags" value="bills" style="display:none;"> Bills
                                </label>
                                <label class="cat-chip glass-panel" style="padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;">
                                    <input type="radio" name="tags" value="entertainment" style="display:none;"> Fun
                                </label>
                                <label class="cat-chip glass-panel" style="padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;">
                                    <input type="radio" name="tags" value="shopping" style="display:none;"> Shop
                                </label>
                                <label class="cat-chip glass-panel" style="padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;">
                                    <input type="radio" name="tags" value="academics" style="display:none;"> Study
                                </label>
                                <label class="cat-chip glass-panel" style="padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;">
                                    <input type="radio" name="tags" value="others" style="display:none;"> Other
                                </label>
                            </div>
                        </div>
                        ` : ''}

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 10px;">Save Record</button>
                    </form>
                </div>
            </div>
        `;
        this.transitionToHTML(html, () => {
            // Visual Selection Logic
            const setupRadios = (name, activeColor) => {
                const start = document.querySelector(`input[name="${name}"]:checked`);
                if (start) start.parentElement.style.border = `1px solid ${activeColor}`;

                document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                    r.addEventListener('change', (e) => {
                        document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.parentElement.style.border = '1px solid var(--glass-border)');
                        e.target.parentElement.style.border = `1px solid ${activeColor}`;
                    });
                });
            };

            setupRadios('mode', 'var(--primary-color)');
            if (!isCredit) setupRadios('tags', 'var(--primary-color)');

            document.getElementById('btn-back').onclick = () => {
                const data = State.getData();
                this.showDashboard(data.user);
            };

            document.getElementById('trans-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('t-amount').value;
                const desc = document.getElementById('t-desc').value;
                const mode = document.querySelector('input[name="mode"]:checked').value;
                let tags = null;
                if (!isCredit) {
                    tags = document.querySelector('input[name="tags"]:checked').value;
                }

                const t = {
                    type: type,
                    amount: amount,
                    desc: desc,
                    mode: mode,
                    tags: tags
                };

                document.dispatchEvent(new CustomEvent('app:add-transaction', { detail: t }));
            });
        });
    },

    showProfileModal(user) {
        // Toggle Logic
        const currentTheme = document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

        const html = `
            <div id="profile-modal-overlay" class="modal-overlay modal-active" style="display: flex;">
                <div class="glass-panel" style="padding: 25px; width: 85%; max-width: 350px; text-align: center;">
                    <div style="width: 80px; height: 80px; margin: 0 auto 15px; border-radius: 50%; background: var(--bg-gradient-2); display: flex; align-items: center; justify-content: center;">
                         <i class="ri-user-smile-line" style="font-size: 3rem; color: var(--primary-color);"></i>
                    </div>
                    <h2 style="margin-bottom: 5px;">${user.name}</h2>
                    <p style="color: var(--text-muted); margin-bottom: 25px;">Account Settings</p>
                    
                    <button id="btn-theme-toggle" class="glass-panel" style="width: 100%; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span><i class="ri-contrast-line"></i> Theme</span>
                        <span id="theme-label" style="font-weight: 600; color: var(--primary-color);">${currentTheme.toUpperCase()}</span>
                    </button>
                    
                    <button id="btn-close-profile" style="color: var(--text-muted); background: transparent; margin-top: 10px;">Close</button>
                </div>
            </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);

        // Animation
        gsap.from(div.querySelector('.glass-panel'), { scale: 0.9, opacity: 0, duration: 0.2 });

        // Handlers
        document.getElementById('btn-theme-toggle').onclick = () => {
            const body = document.body;
            const isDark = body.getAttribute('data-theme') === 'dark';
            if (isDark) {
                body.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                document.getElementById('theme-label').textContent = 'LIGHT';
            } else {
                body.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                document.getElementById('theme-label').textContent = 'DARK';
            }
        };

        document.getElementById('btn-close-profile').onclick = () => {
            gsap.to(div.querySelector('.glass-panel'), { scale: 0.9, opacity: 0, duration: 0.2, onComplete: () => div.remove() });
        };
    },

    showEditForm(id, type) {
        const data = State.getData();
        const t = data.transactions.find(tx => tx.id === id);
        if (!t) return;

        // Reuse transaction form logic but populate data
        this.showTransactionForm(type);

        // Wait for transition, then populate
        setTimeout(() => {
            document.querySelector('h2').textContent = `Edit ${type === 'credit' ? 'Credit' : 'Debit'}`;
            document.querySelector('button[type="submit"]').textContent = 'Update Transaction';

            document.getElementById('t-amount').value = t.amount;
            document.getElementById('t-desc').value = t.desc;

            // Trigger click to select radio and update style
            const modeRadio = document.querySelector(`input[name="mode"][value="${t.mode}"]`);
            if (modeRadio) modeRadio.parentElement.click();

            if (type === 'debit' && t.tags) {
                const tagRadio = document.querySelector(`input[name="tags"][value="${t.tags}"]`);
                if (tagRadio) tagRadio.parentElement.click();
            }

            // Override Submit
            const form = document.getElementById('trans-form');
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            // Add Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn-danger';
            deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i> Delete Transaction';
            newForm.appendChild(deleteBtn);

            deleteBtn.onclick = () => {
                if (confirm("Are you sure you want to delete this transaction? Balance will be reverted.")) {
                    State.deleteTransaction(id);
                    this.showDashboard(State.getData().user);
                }
            };

            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('t-amount').value;
                const desc = document.getElementById('t-desc').value;
                const mode = document.querySelector('input[name="mode"]:checked').value;
                let tags = null;
                if (type === 'debit') {
                    tags = document.querySelector('input[name="tags"]:checked').value;
                }

                const newUtil = {
                    amount: amount,
                    desc: desc,
                    mode: mode,
                    tags: tags
                };

                // Directly call update instead of event for simplicity or dispatch specific event
                State.editTransaction(id, newUtil);

                // Go back
                this.showDashboard(State.getData().user);
            });
        }, 500); // slight delay for animation
    },

    showLendForm() {
        const html = `
             <div class="screen active-screen" style="display: flex; flex-direction: column; height: 100%;">
                <header style="padding: 20px; display: flex; align-items: center; gap: 15px;">
                    <button id="btn-back" style="font-size: 1.5rem; color: var(--text-main); background: transparent;"><i class="ri-arrow-left-line"></i></button>
                    <h2 style="font-size: 1.2rem;">Lend / Borrow</h2>
                </header>
                
                <div style="flex: 1; padding: 0 20px; overflow-y: auto;">
                    <form id="lend-form">
                        <div style="display: flex; gap: 12px; margin-bottom: 25px;">
                            <label class="glass-panel" style="flex: 1; padding: 15px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                <input type="radio" name="lend_type" value="lend" checked style="display: none;"> 
                                <span style="font-weight: 600;">Lend (Give)</span>
                            </label>
                             <label class="glass-panel" style="flex: 1; padding: 15px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                <input type="radio" name="lend_type" value="borrow" style="display: none;"> 
                                <span style="font-weight: 600;">Borrow (Take)</span>
                            </label>
                        </div>

                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 15px; color: var(--text-muted); font-size: 0.9rem;">Amount</label>
                            <div class="glass-panel" style="padding: 10px; display:flex; align-items: center;">
                                <span style="font-size: 1.5rem; margin-right: 10px; color: var(--text-muted);">₹</span>
                                <input type="number" id="l-amount" placeholder="0" required style="font-size: 2rem; font-weight: 700; color: var(--text-main); background: transparent; border: none; padding: 0; margin: 0;">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Who?</label>
                            <input type="text" id="l-person" placeholder="Person Name" required>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Reason?</label>
                            <input type="text" id="l-desc" placeholder="For lunch, cab, etc...">
                        </div>

                         <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 10px; color: var(--text-muted); font-size: 0.9rem;">Via</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                 <label class="glass-panel" style="padding: 12px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="l-mode" value="hand" checked style="display: none;">
                                    <span style="font-size: 0.9rem;">Cash</span>
                                </label>
                                <label class="glass-panel" style="padding: 12px; text-align: center; cursor: pointer; transition: all 0.2s;">
                                    <input type="radio" name="l-mode" value="bank" style="display: none;">
                                    <span style="font-size: 0.9rem;">Bank</span>
                                </label>
                            </div>
                        </div>

                        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 10px;">Save Record</button>
                    </form>
                </div>
            </div>
        `;
        this.transitionToHTML(html, () => {
            // Visual Selection (Reusing similar logic)
            const setupRadios = (name, activeColor) => {
                const start = document.querySelector(`input[name="${name}"]:checked`);
                if (start) start.parentElement.style.border = `1px solid ${activeColor}`;

                document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                    r.addEventListener('change', (e) => {
                        document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.parentElement.style.border = '1px solid var(--glass-border)');
                        e.target.parentElement.style.border = `1px solid ${activeColor}`;
                    });
                });
            };
            setupRadios('lend_type', 'var(--primary-color)');
            setupRadios('l-mode', 'var(--primary-color)');

            document.getElementById('btn-back').onclick = () => {
                const data = State.getData();
                this.showDashboard(data.user);
            };

            document.getElementById('lend-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const type = document.querySelector('input[name="lend_type"]:checked').value;
                const amount = document.getElementById('l-amount').value;
                const person = document.getElementById('l-person').value;
                const desc = document.getElementById('l-desc').value;
                const mode = document.querySelector('input[name="l-mode"]:checked').value;

                const t = {
                    type: type, // 'lend' or 'borrow'
                    amount: amount,
                    person: person,
                    desc: desc,
                    mode: mode
                };

                document.dispatchEvent(new CustomEvent('app:add-transaction', { detail: t }));
            });
        });
    },

    showHistoryScreen() {
        const data = State.getData();
        // Sort by date desc
        const transactions = data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const html = `
            <div class="screen active-screen" style="display: flex; flex-direction: column; height: 100%;">
                 <header style="padding: 20px; display: flex; align-items: center; gap: 15px;">
                    <button id="btn-back-hist" style="font-size: 1.5rem; color: var(--text-main); background: transparent;"><i class="ri-arrow-left-line"></i></button>
                    <h2 style="font-size: 1.2rem;">Full History</h2>
                </header>
                <div style="flex: 1; padding: 0 20px; overflow-y: auto;">
                    <div id="full-history-list">
                        ${this.renderTransactionList(transactions, true)}
                    </div>
                </div>
            </div>
        `;

        this.transitionToHTML(html, () => {
            document.getElementById('btn-back-hist').onclick = () => this.showDashboard(data.user);

            // Reuse binding logic for edits/settle
            const list = document.getElementById('full-history-list');
            list.addEventListener('click', (e) => {
                if (e.target.closest('.btn-settle')) {
                    e.stopPropagation();
                    const btn = e.target.closest('.btn-settle');
                    this.openSettleModal(btn.dataset.id, btn.dataset.type, btn.dataset.amount);
                } else if (e.target.closest('.transaction-item')) {
                    const el = e.target.closest('.transaction-item');
                    // Check if it is credit/debit for editing
                    if (el.dataset.type === 'credit' || el.dataset.type === 'debit') {
                        this.showEditForm(el.dataset.id, el.dataset.type);
                    }
                    // If lend/borrow, maybe show edit too? User requested "edit history option".
                    // Let's enable editing for all types for better UX, but handle logic carefully.
                    // The current showEditForm supports credit/debit via showTransactionForm.
                    // Lend form is different.
                }
            });
        });
    },
    renderKeypad() {
        return `
            <div class="keypad-grid">
                <div class="keypad-btn" data-val="1">1</div>
                <div class="keypad-btn" data-val="2">2</div>
                <div class="keypad-btn" data-val="3">3</div>
                <div class="keypad-btn" data-val="4">4</div>
                <div class="keypad-btn" data-val="5">5</div>
                <div class="keypad-btn" data-val="6">6</div>
                <div class="keypad-btn" data-val="7">7</div>
                <div class="keypad-btn" data-val="8">8</div>
                <div class="keypad-btn" data-val="9">9</div>
                <div class="keypad-btn" style="background: transparent; border: none; box-shadow: none;"></div>
                <div class="keypad-btn" data-val="0">0</div>
                <div class="keypad-btn" data-val="del" style="color: var(--danger); font-size: 1.2rem;"><i class="ri-delete-back-2-line"></i></div>
            </div>
        `;
    },

    bindKeypad(onComplete) {
        let currentPin = '';
        const dots = document.querySelectorAll('.pin-dot');

        const updateDots = () => {
            dots.forEach((dot, i) => {
                if (i < currentPin.length) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
            });
        };

        const btns = document.querySelectorAll('.keypad-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = btn.dataset.val;
                if (!val) return;

                if (val === 'del') {
                    currentPin = currentPin.slice(0, -1);
                } else if (currentPin.length < 4) {
                    currentPin += val;
                }

                updateDots();

                if (currentPin.length === 4) {
                    setTimeout(() => {
                        const result = onComplete(currentPin);
                        if (result === false) {
                            currentPin = '';
                            updateDots();
                        }
                    }, 100);
                }
            });
        });
    }
};
