import { Storage } from './storage.js';

export const Auth = {
    isAuthenticated() {
        const data = Storage.get();
        // If user object exists, they are "registred", but we need a session check in real app.
        // For this simple app, we will use a global variable in app.js to track "current session".
        return !!data && !!data.user;
    },

    register(name, pin) {
        const data = Storage.get();
        data.user = { name, pin };
        Storage.set(data);
        return true;
    },

    login(pin) {
        const data = Storage.get();
        if (data && data.user && data.user.pin === pin) {
            return data.user;
        }
        return false;
    }
};
