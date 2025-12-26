import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface TestButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const TestButton: React.FC<TestButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const getButtonClasses = () => {
    const base = 'py-3 px-4 rounded-lg items-center my-1.5';
    if (disabled || loading) return `${base} bg-gray-300`;
    
    switch (variant) {
      case 'secondary':
        return `${base} bg-purple-500`;
      case 'danger':
        return `${base} bg-red-500`;
      default:
        return `${base} bg-blue-500`;
    }
  };

  return (
    <TouchableOpacity
      className={getButtonClasses()}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text className="text-white text-base font-semibold">
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

interface TestCardProps {
  title: string;
  children: React.ReactNode;
}

export const TestCard: React.FC<TestCardProps> = ({ title, children }) => {
  return (
    <View className="bg-white rounded-lg p-5 mb-3 border border-gray-100">
      <Text className="text-base font-bold mb-4 text-gray-900">{title}</Text>
      {children}
    </View>
  );
};

interface TestResultProps {
  result: any;
}

export const TestResult: React.FC<TestResultProps> = ({ result }) => {
  if (!result) return null;

  return (
    <View className="bg-gray-50 border border-gray-200 p-3 rounded-lg mt-3">
      <Text className="text-xs font-semibold mb-2 text-gray-500 uppercase">Result:</Text>
      <Text className="text-xs font-mono text-gray-700 leading-5">
        {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
      </Text>
    </View>
  );
};
