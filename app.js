import { Storage } from './modules/storage.js';
import { Auth } from './modules/auth.js';
import { State } from './modules/state.js';
import { UI } from './modules/ui.js';

// Initialize
Storage.init();

document.addEventListener('DOMContentLoaded', () => {
    // Simulate initial load
    setTimeout(() => {
        initApp();
    }, 1000);
});

function initApp() {
    // Theme Init
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }

    const data = Storage.get();

    // Auth Check
    if (Auth.isAuthenticated()) {
        UI.showLogin(data.user.name);
    } else {
        UI.showRegister();
    }

    // Dynamic Footer Logic
    const footer = document.querySelector('.app-footer');
    let isInputFocused = false;

    const toggleFooter = () => {
        if (isInputFocused) {
            footer.classList.remove('visible');
            return;
        }

        const scrollPosition = window.innerHeight + window.scrollY;
        const threshold = document.body.offsetHeight - 50; // Buffer

        if (scrollPosition >= threshold) {
            footer.classList.add('visible');
        } else {
            footer.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', toggleFooter);

    // Initial check (in case content is short)
    setTimeout(toggleFooter, 500);

    // Mobile Keyboard Detection (Approximation via focus)
    document.body.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            isInputFocused = true;
            toggleFooter();
        }
    });

    document.body.addEventListener('focusout', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            isInputFocused = false;
            // Slight delay to allow keyboard to close
            setTimeout(toggleFooter, 300);
        }
    });
}

function checkReminders() {
    const data = State.getData();
    if (!data.transactions) return;

    data.transactions.forEach(t => {
        if (t.type === 'lend') {
            const now = new Date();
            let showReminder = false;
            let msg = '';

            // 1. Custom Reminder Date
            if (t.reminderDate) {
                const rDate = new Date(t.reminderDate);
                // Check if today matches the reminder date (ignoring time)
                if (now.toDateString() === rDate.toDateString()) {
                    showReminder = true;
                    msg = `Reminder: Collect ₹${t.amount} from ${t.person} (Today)`;
                } else if (now > rDate && !t.status) {
                    // Also remind if past due (and not settled)
                    showReminder = true;
                    const diff = Math.floor((now - rDate) / (1000 * 60 * 60 * 24));
                    msg = `Overdue: Collect ₹${t.amount} from ${t.person} (${diff} days ago)`;
                }
            }
            // 2. Default Weekly fallback (only if no custom date set)
            else {
                const date = new Date(t.date);
                const diffTime = Math.abs(now - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 0 && diffDays % 7 === 0) {
                    showReminder = true;
                    msg = `Reminder: Collect ₹${t.amount} from ${t.person} (${diffDays} days ago)`;
                }
            }

            if (showReminder) {
                showToast(msg);
            }
        }
    });
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '15px 25px';
    toast.style.color = 'var(--text-main)';
    toast.style.zIndex = '1000';
    toast.style.minWidth = '300px';
    toast.style.textAlign = 'center';
    toast.innerHTML = `<i class="ri-alarm-warning-line"></i> ${message}`;

    document.body.appendChild(toast);

    // Animate in
    gsap.from(toast, { y: 50, opacity: 0, duration: 0.5 });

    // Remove
    setTimeout(() => {
        gsap.to(toast, { y: 50, opacity: 0, duration: 0.5, onComplete: () => toast.remove() });
    }, 4000);
}

// Event Listeners for UI interaction
document.addEventListener('app:register', (e) => {
    const { name, pin } = e.detail;
    Auth.register(name, pin);
    const user = Auth.login(pin);
    UI.showDashboard(user);
});

document.addEventListener('app:login', (e) => {
    const { pin } = e.detail;
    const user = Auth.login(pin);
    if (user) {
        UI.showDashboard(user);
        checkReminders();
    } else {
        gsap.to('#login-form', { x: [-10, 10, -10, 10, 0], duration: 0.4 });
    }
});

document.addEventListener('app:add-transaction', (e) => {
    const transaction = e.detail;
    State.addTransaction(transaction);
    const data = State.getData();
    UI.showDashboard(data.user);
});
