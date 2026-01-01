import { Storage } from './storage.js';

export const State = {
    getData() {
        return Storage.get();
    },

    saveData(data) {
        Storage.set(data);
    },

    addTransaction(transaction) {
        // transaction: { type: 'credit'|'debit'|'lend'|'borrow', amount, desc, mode, tags, person, date }
        const data = this.getData();
        const t = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...transaction
        };
        data.transactions.unshift(t); // Add to top

        // Update Balances
        const amt = parseFloat(t.amount);

        if (t.type === 'credit') {
            // Money coming in
            if (t.mode === 'hand') data.balance.hand += amt;
            if (t.mode === 'bank') data.balance.bank += amt;
        } else if (t.type === 'debit') {
            // Money going out
            if (t.mode === 'hand') data.balance.hand -= amt;
            if (t.mode === 'bank') data.balance.bank -= amt;
        }
        else if (t.type === 'lend') {
            if (t.mode === 'hand') data.balance.hand -= amt;
            if (t.mode === 'bank') data.balance.bank -= amt;
        } else if (t.type === 'borrow') {
            if (t.mode === 'hand') data.balance.hand += amt;
            if (t.mode === 'bank') data.balance.bank += amt;
        }

        this.saveData(data);
        return t;
    },

    getTransactions(filterType = null) {
        const data = this.getData();
        if (!filterType) return data.transactions;
        return data.transactions.filter(t => t.type === filterType);
    },

    // Get aggregated data for charts
    getSpendingByTag() {
        const data = this.getData();
        const tagMap = {};
        data.transactions
            .filter(t => t.type === 'debit' && t.tags)
            .forEach(t => {
                if (!tagMap[t.tags]) tagMap[t.tags] = 0;
                tagMap[t.tags] += parseFloat(t.amount);
            });
        return tagMap;
    },

    settleTransaction(id, settlementMode) {
        // settlementMode: 'hand' | 'bank'
        // This is where the money is received TO or paid FROM
        const data = this.getData();
        const tIndex = data.transactions.findIndex(t => t.id === id);

        if (tIndex === -1) return false;

        const t = data.transactions[tIndex];
        if (t.status === 'settled') return false; // Already settled

        const amt = parseFloat(t.amount);

        // Update Balance Logic
        if (t.type === 'lend') {
            // I lent money, now I am receiving it back. ADD to balance.
            if (settlementMode === 'hand') data.balance.hand += amt;
            if (settlementMode === 'bank') data.balance.bank += amt;
            t.status = 'settled'; // Mark as settled
        } else if (t.type === 'borrow') {
            // I borrowed money, now I am paying it back. DEDUCT from balance.
            if (settlementMode === 'hand') data.balance.hand -= amt;
            if (settlementMode === 'bank') data.balance.bank -= amt;
            t.status = 'settled';
        }

        data.transactions[tIndex] = t;
        this.saveData(data);
        return true;
    },

    editTransaction(id, newUtil) {
        const data = this.getData();
        const tIndex = data.transactions.findIndex(t => t.id === id);
        if (tIndex === -1) return false;
        const oldT = data.transactions[tIndex];
        const oldAmt = parseFloat(oldT.amount);

        // Revert OLD
        if (oldT.type === 'credit') {
            if (oldT.mode === 'hand') data.balance.hand -= oldAmt;
            if (oldT.mode === 'bank') data.balance.bank -= oldAmt;
        } else if (oldT.type === 'debit') {
            if (oldT.mode === 'hand') data.balance.hand += oldAmt;
            if (oldT.mode === 'bank') data.balance.bank += oldAmt;
        }

        // Apply NEW
        const newAmt = parseFloat(newUtil.amount);
        const newMode = newUtil.mode;

        if (oldT.type === 'credit') {
            if (newMode === 'hand') data.balance.hand += newAmt;
            if (newMode === 'bank') data.balance.bank += newAmt;
        } else if (oldT.type === 'debit') {
            if (newMode === 'hand') data.balance.hand -= newAmt;
            if (newMode === 'bank') data.balance.bank -= newAmt;
        }

        // Update Object
        data.transactions[tIndex] = { ...oldT, ...newUtil };
        this.saveData(data);
        return true;
    },

    deleteTransaction(id) {
        const data = this.getData();
        const tIndex = data.transactions.findIndex(t => t.id === id);
        if (tIndex === -1) return false;

        const oldT = data.transactions[tIndex];
        const oldAmt = parseFloat(oldT.amount);

        // Revert Balance Effect (Same logic as edit revert)
        if (oldT.type === 'credit') {
            if (oldT.mode === 'hand') data.balance.hand -= oldAmt;
            if (oldT.mode === 'bank') data.balance.bank -= oldAmt;
        } else if (oldT.type === 'debit') {
            if (oldT.mode === 'hand') data.balance.hand += oldAmt;
            if (oldT.mode === 'bank') data.balance.bank += oldAmt;
        }
        else if (oldT.type === 'lend' && oldT.status !== 'settled') {
            if (oldT.mode === 'hand') data.balance.hand += oldAmt;
            if (oldT.mode === 'bank') data.balance.bank += oldAmt;
        } else if (oldT.type === 'borrow' && oldT.status !== 'settled') {
            if (oldT.mode === 'hand') data.balance.hand -= oldAmt;
            if (oldT.mode === 'bank') data.balance.bank -= oldAmt;
        }

        // Remove from array
        data.transactions.splice(tIndex, 1);
        this.saveData(data);
        return true;
    }
};
