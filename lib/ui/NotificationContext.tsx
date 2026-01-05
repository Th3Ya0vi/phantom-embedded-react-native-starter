import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Gradients } from '@/lib/theme';

const { width } = Dimensions.get('window');

type AlertButton = {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
};

type AlertConfig = {
    title: string;
    message: string;
    buttons?: AlertButton[];
};

type NotificationContextType = {
    showToast: (msg: string) => void;
    showAlert: (config: AlertConfig) => void;
    hideAlert: () => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
    const [isAlertVisible, setAlertVisible] = useState(false);

    const showToast = useCallback((msg: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastMessage(msg);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    }, []);

    const showAlert = useCallback((config: AlertConfig) => {
        setAlertConfig(config);
        setAlertVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setAlertVisible(false);
        // Delay clearing config for logout animation if needed
        setAlertConfig(null);
    }, []);

    const handleAlertButtonPress = (btn: AlertButton) => {
        hideAlert();
        if (btn.onPress) {
            // Small delay to ensure modal close before heavy action if any
            setTimeout(btn.onPress, 100);
        }
    };

    return (
        <NotificationContext.Provider value={{ showToast, showAlert, hideAlert }}>
            {children}

            {/* --- TOAST UI --- */}
            {toastMessage && (
                <View style={styles.toastContainer} pointerEvents="none">
                    <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={styles.toastBlur}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </BlurView>
                </View>
            )}

            {/* --- ALERT UI --- */}
            <Modal
                visible={isAlertVisible}
                transparent
                animationType="fade"
                onRequestClose={hideAlert}
            >
                <View style={styles.alertOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                    <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.alertCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                            style={styles.alertGlass}
                        >
                            <View style={styles.alertContent}>
                                {alertConfig?.title && (
                                    <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                                )}
                                <Text style={styles.alertMessage}>{alertConfig?.message}</Text>

                                <View style={styles.alertButtons}>
                                    {alertConfig?.buttons?.length ? (
                                        alertConfig.buttons.map((btn, idx) => {
                                            const isDestructive = btn.style === 'destructive';
                                            const isCancel = btn.style === 'cancel';

                                            return (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[
                                                        styles.alertBtn,
                                                        idx > 0 && styles.alertBtnMargin,
                                                        isDestructive && styles.alertBtnDestructive,
                                                    ]}
                                                    onPress={() => handleAlertButtonPress(btn)}
                                                >
                                                    <Text style={[
                                                        styles.alertBtnText,
                                                        isDestructive && styles.alertBtnTextDestructive,
                                                        isCancel && styles.alertBtnTextCancel
                                                    ]}>
                                                        {btn.text}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })
                                    ) : (
                                        <TouchableOpacity style={styles.alertBtn} onPress={hideAlert}>
                                            <Text style={styles.alertBtnText}>OK</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </View>
            </Modal>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    // Toast
    toastContainer: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastBlur: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    toastText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Alert
    alertOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 30,
    },
    alertCard: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    alertGlass: {
        padding: 24,
    },
    alertContent: {
        alignItems: 'center',
    },
    alertTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessage: {
        color: '#94A3B8',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    alertButtons: {
        width: '100%',
        flexDirection: 'column',
        gap: 10,
    },
    alertBtn: {
        width: '100%',
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    alertBtnMargin: {
        // mt: 0, handled by gap
    },
    alertBtnDestructive: {
        backgroundColor: 'rgba(255,75,75,0.1)',
        borderColor: 'rgba(255,75,75,0.2)',
    },
    alertBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    alertBtnTextDestructive: {
        color: '#FF4B4B',
    },
    alertBtnTextCancel: {
        color: '#94A3B8',
        fontWeight: '500',
    },
});
