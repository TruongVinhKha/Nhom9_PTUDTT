import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';

const LoadingScreen = memo(() => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    // Main fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous rotation for spinner
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animated dots
    const animateDots = () => {
      const animations = dotsAnim.map((dot, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.parallel(animations).start(() => animateDots());
    };

    animateDots();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background with gradient effect */}
      <View style={styles.backgroundGradient} />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>🎓</Text>
            </View>
          </View>
        </Animated.View>

        {/* App Title */}
        <Text style={styles.appTitle}>EduTrack</Text>
        <Text style={styles.appSubtitle}>Học tập thông minh</Text>

        {/* Custom Spinner */}
        <View style={styles.spinnerContainer}>
          <Animated.View 
            style={[
              styles.customSpinner,
              {
                transform: [{ rotate: spin }]
              }
            ]}
          >
            <View style={styles.spinnerRing} />
          </Animated.View>
        </View>

        {/* Loading Text with Animated Dots */}
        <View style={styles.loadingTextContainer}>
          <Text style={styles.loadingText}>Đang tải</Text>
          <View style={styles.dotsContainer}>
            {dotsAnim.map((dot, index) => (
              <Animated.Text
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity: dot,
                    transform: [{
                      translateY: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      })
                    }]
                  }
                ]}
              >
                .
              </Animated.Text>
            ))}
          </View>
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={styles.progressText}>Kết nối</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={styles.progressText}>Xác thực</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot} />
            <Text style={[styles.progressText, styles.progressTextInactive]}>Hoàn thành</Text>
          </View>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureText}>Học tập hiệu quả</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Theo dõi tiến độ</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Mục tiêu cá nhân</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 EduTrack Team</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17375F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#17375F',
    opacity: 0.98,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#006A5C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7AE582',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logoText: {
    fontSize: 40,
    color: '#17375F',
    fontWeight: 'bold',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#7AE582',
    marginBottom: 48,
    textAlign: 'center',
    fontWeight: '500',
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  customSpinner: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#7AE582',
    borderRightColor: '#7AE582',
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  dot: {
    fontSize: 20,
    color: '#7AE582',
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#7AE582',
    opacity: 1,
  },
  progressText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  progressTextInactive: {
    opacity: 0.5,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.4,
    marginTop: 4,
  },
});

export default LoadingScreen;