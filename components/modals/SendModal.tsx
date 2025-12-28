import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing } from '@/lib/theme';

export type Token = 'SOL' | 'USDC';

interface SendModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (recipient: string, amount: string, token: Token) => Promise<void>;
  solBalance: number;
  usdcBalance: number;
}

export function SendModal({ visible, onClose, onSend, solBalance, usdcBalance }: SendModalProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token>('USDC');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(recipient, amount, selectedToken);
      onClose(); // Close modal on success
    } catch (error) {
      console.error("Send failed:", error);
      alert("Transaction Failed. Please check the address and try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getButtonDisabled = () => {
    const numericAmount = parseFloat(amount);
    if (!recipient || !numericAmount || numericAmount <= 0) return true;
    if (selectedToken === 'USDC' && numericAmount > usdcBalance) return true;
    if (selectedToken === 'SOL' && numericAmount > solBalance) return true;
    return false;
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.container}>
          <Text style={styles.title}>Send Asset</Text>
          <Text style={styles.subtitle}>Transfer SOL or USDC to another wallet.</Text>

          {/* Token Selector */}
          <View style={styles.tokenSelector}>
            <TokenButton
              token="USDC"
              balance={usdcBalance}
              isSelected={selectedToken === 'USDC'}
              onPress={() => setSelectedToken('USDC')}
            />
            <TokenButton
              token="SOL"
              balance={solBalance}
              isSelected={selectedToken === 'SOL'}
              onPress={() => setSelectedToken('SOL')}
            />
          </View>

          {/* Inputs */}
          <TextInput
            style={styles.input}
            placeholder="Recipient's SOL Address"
            placeholderTextColor="#64748B"
            value={recipient}
            onChangeText={setRecipient}
          />
          <TextInput
            style={styles.input}
            placeholder={`Amount in ${selectedToken}`}
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Send Button */}
          <Pressable
            style={[styles.sendButton, (getButtonDisabled() || isSending) && styles.disabledButton]}
            onPress={handleSend}
            disabled={getButtonDisabled() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </Pressable>

          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const TokenButton = ({ token, balance, isSelected, onPress }: any) => (
  <Pressable
    style={[styles.tokenButton, isSelected && styles.tokenButtonSelected]}
    onPress={onPress}
  >
    <Text style={styles.tokenName}>{token}</Text>
    <Text style={styles.tokenBalance}>Bal: {balance.toFixed(4)}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#1E3A8A',
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#94A3B8', textAlign: 'center', marginBottom: 30, fontSize: 14 },
  tokenSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tokenButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  tokenButtonSelected: {
    backgroundColor: 'rgba(47, 102, 246, 0.2)',
    borderColor: 'rgba(47, 102, 246, 0.5)',
  },
  tokenName: { color: '#FFF', fontWeight: '700' },
  tokenBalance: { color: '#64748B', fontSize: 11, marginTop: 4 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 12,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    backgroundColor: '#2F66F6',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: { backgroundColor: '#334155' },
  sendButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  closeButton: { padding: 12, alignItems: 'center', marginTop: 8 },
  closeButtonText: { color: '#64748B', fontSize: 14 },
});
