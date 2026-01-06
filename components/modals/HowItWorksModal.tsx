import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Dimensions,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInRight,
    SlideInUp,
} from 'react-native-reanimated';
import { Colors, Spacing, Typography, Gradients } from '@/lib/theme';

const { width } = Dimensions.get('window');

interface Step {
    title: string;
    description: string;
    icon: string;
    color: string;
}

const STEPS: Step[] = [
    {
        title: 'Access the Network',
        description: 'Sign in instantly with your Email or Social accounts. Enter your exclusive invite code to unlock the GeSIM dashboard.',
        icon: '🔑',
        color: '#2F66F6',
    },
    {
        title: 'Pick Your Destination',
        description: 'Browse 190+ countries. From high-speed 5G to affordable travel plans, choose the data package that fits your journey.',
        icon: '🌍',
        color: '#00E5FF',
    },
    {
        title: 'Power Your Vault',
        description: 'Fund your built-in secure vault with SOL and USDC. Enjoy private, near-instant payments without any bank involvement.',
        icon: '🛡️',
        color: '#8b5cf6',
    },
    {
        title: 'Instant Activation',
        description: 'Receive your eSIM QR code immediately after purchase. Scan or tap to install and start surfing the globe.',
        icon: '⚡',
        color: '#22c55e',
    },
];

interface HowItWorksModalProps {
    visible: boolean;
    onClose: () => void;
}

export function HowItWorksModal({ visible, onClose }: HowItWorksModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
            setTimeout(() => setCurrentStep(0), 300);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

                <Animated.View
                    entering={SlideInUp.springify().damping(15)}
                    style={styles.container}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={styles.content}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.progressContainer}>
                                {STEPS.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.progressDot,
                                            i <= currentStep && { backgroundColor: STEPS[currentStep].color, width: 20 }
                                        ]}
                                    />
                                ))}
                            </View>
                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </Pressable>
                        </View>

                        {/* Step Content */}
                        <View style={styles.stepContainer}>
                            <Animated.View
                                key={currentStep}
                                entering={FadeInRight.duration(400)}
                                style={styles.iconWrapper}
                            >
                                <LinearGradient
                                    colors={[STEPS[currentStep].color + '40', 'transparent']}
                                    style={styles.iconGlow}
                                />
                                <Text style={styles.iconText}>{STEPS[currentStep].icon}</Text>
                            </Animated.View>

                            <Animated.Text
                                key={`title-${currentStep}`}
                                entering={FadeInDown.delay(100)}
                                style={styles.stepTitle}
                            >
                                {STEPS[currentStep].title}
                            </Animated.Text>

                            <Animated.Text
                                key={`desc-${currentStep}`}
                                entering={FadeInDown.delay(200)}
                                style={styles.stepDescription}
                            >
                                {STEPS[currentStep].description}
                            </Animated.Text>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            {currentStep > 0 ? (
                                <Pressable onPress={handleBack} style={styles.backBtn}>
                                    <Text style={styles.backBtnText}>Back</Text>
                                </Pressable>
                            ) : <View style={{ flex: 1 }} />}

                            <Pressable
                                onPress={handleNext}
                                style={[styles.nextBtn, { backgroundColor: STEPS[currentStep].color }]}
                            >
                                <Text style={styles.nextBtnText}>
                                    {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next Step'}
                                </Text>
                            </Pressable>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Added darker overlay for better isolation
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: '#0F172A', // Using solid background for better readability
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    content: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        height: 6,
        width: 12,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    stepContainer: {
        alignItems: 'center',
        minHeight: 280,
    },
    iconWrapper: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    iconGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 55,
    },
    iconText: {
        fontSize: 56,
    },
    stepTitle: {
        color: '#FFFFFF', // Pure white
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    stepDescription: {
        color: '#CBD5E1', // Brighter text for better reading
        fontSize: 17,
        lineHeight: 26,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        gap: 16,
    },
    backBtn: {
        flex: 1,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backBtnText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
    nextBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    nextBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
