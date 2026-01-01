const STORAGE_KEY = 'credit_debit_app_v1';

export const Storage = {
    get() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    set(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    // Initialize default structure if empty
    init() {
        if (!this.get()) {
            this.set({
                user: null, // { name: '...', pin: '...' }
                balance: { hand: 0, bank: 0 },
                transactions: [], // { id, type, amount, desc, mode, date, tags, person }
                reminders: []
            });
        }
    }
};
