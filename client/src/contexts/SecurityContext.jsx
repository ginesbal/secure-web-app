import { createContext, useContext, useState } from 'react';

const SecurityContext = createContext();

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
};

export function SecurityProvider({ children }) {
    const [securityFeatures, setSecurityFeatures] = useState({
        xssProtection: true,
        sqlProtection: true,
        csrfProtection: true,
        rateLimit: true,
        inputSanitization: true,
        secureHeaders: true
    });

    const [attackHistory, setAttackHistory] = useState([]);
    const [statistics, setStatistics] = useState({
        attacksBlocked: 0,
        attacksSuccessful: 0,
        totalAttempts: 0
    });

    const toggleFeature = (feature) => {
        setSecurityFeatures(prev => ({
            ...prev,
            [feature]: !prev[feature]
        }));
    };

    const recordAttack = (type, blocked, details) => {
        const attack = {
            id: Date.now(),
            type,
            blocked,
            details,
            timestamp: new Date().toISOString()
        };

        setAttackHistory(prev => [attack, ...prev].slice(0, 50));

        setStatistics(prev => ({
            ...prev,
            totalAttempts: prev.totalAttempts + 1,
            attacksBlocked: blocked ? prev.attacksBlocked + 1 : prev.attacksBlocked,
            attacksSuccessful: !blocked ? prev.attacksSuccessful + 1 : prev.attacksSuccessful
        }));
    };

    const value = {
        securityFeatures,
        toggleFeature,
        attackHistory,
        statistics,
        recordAttack
    };

    return (
        <SecurityContext.Provider value={value}>
            {children}
        </SecurityContext.Provider>
    );
}
