
// Add React import to fix namespace error
import React from 'react';

export interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}