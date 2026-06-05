/**
 * Animation utilities - Subtle micro-interactions
 */

import { Animated, Easing } from 'react-native';

export const fadeIn = (
  anim: Animated.Value,
  duration = 300,
  toValue = 1,
): Animated.CompositeAnimation =>
  Animated.timing(anim, {
    toValue,
    duration,
    useNativeDriver: true,
  });

export const fadeOut = (
  anim: Animated.Value,
  duration = 200,
): Animated.CompositeAnimation =>
  Animated.timing(anim, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });

export const slideUp = (
  anim: Animated.Value,
  distance = 20,
  duration = 400,
): Animated.CompositeAnimation =>
  Animated.timing(anim, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });

export const slideDown = (
  anim: Animated.Value,
  distance = 20,
  duration = 300,
): Animated.CompositeAnimation =>
  Animated.timing(anim, {
    toValue: distance,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });

export const scaleIn = (
  anim: Animated.Value,
  duration = 200,
): Animated.CompositeAnimation =>
  Animated.spring(anim, {
    toValue: 1,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  });

export const scaleOut = (
  anim: Animated.Value,
  duration = 150,
): Animated.CompositeAnimation =>
  Animated.timing(anim, {
    toValue: 0.95,
    duration,
    useNativeDriver: true,
  });

export const stagger = (
  animations: Animated.CompositeAnimation[],
  staggerMs = 50,
): Animated.CompositeAnimation[] =>
  animations.map((anim, index) =>
    Animated.delay(index * staggerMs),
  ) as any;

export const parallel = Animated.parallel;

export const sequence = Animated.sequence;

export const pressAnim = (anim: Animated.Value) =>
  Animated.sequence([
    scaleOut(anim),
    scaleIn(anim),
  ]);
