import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Avatar, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  // Lấy tên từ email
  const getUserDisplayName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Bạn';
  };

  // Lấy avatar letter từ email
  const getAvatarLetter = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Text 
              size={60} 
              label={getAvatarLetter()} 
              style={styles.avatar}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getCurrentGreeting()}</Text>
              <Text style={styles.userName}>{getUserDisplayName()}!</Text>
            </View>
          </View>
          <IconButton 
            icon="bell-outline" 
            size={24} 
            onPress={() => {/* Handle notifications */}}
            style={styles.notificationButton}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.quickActionsGrid}>
            <Card style={styles.quickActionCard} onPress={() => {/* Handle action */}}>
              <Card.Content style={styles.quickActionContent}>
                <IconButton icon="account" size={32} iconColor="#6750A4" />
                <Text style={styles.quickActionText}>Hồ sơ</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.quickActionCard} onPress={() => {/* Handle action */}}>
              <Card.Content style={styles.quickActionContent}>
                <IconButton icon="cog" size={32} iconColor="#6750A4" />
                <Text style={styles.quickActionText}>Cài đặt</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.quickActionCard} onPress={() => {/* Handle action */}}>
              <Card.Content style={styles.quickActionContent}>
                <IconButton icon="help-circle" size={32} iconColor="#6750A4" />
                <Text style={styles.quickActionText}>Trợ giúp</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.quickActionCard} onPress={() => {/* Handle action */}}>
              <Card.Content style={styles.quickActionContent}>
                <IconButton icon="information" size={32} iconColor="#6750A4" />
                <Text style={styles.quickActionText}>Thông tin</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <Card style={styles.activityCard}>
            <Card.Content>
              <View style={styles.activityItem}>
                <IconButton icon="clock-outline" size={20} iconColor="#666" />
                <View style={styles.activityText}>
                  <Text style={styles.activityTitle}>Đăng nhập thành công</Text>
                  <Text style={styles.activityTime}>Vừa xong</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <Card style={styles.infoCard}>
            <Card.Content>
              <View style={styles.infoRow}>
                <IconButton icon="email" size={20} iconColor="#666" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'Không có thông tin'}</Text>
                </View>
              </View>
              <Divider style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <IconButton icon="shield-check" size={20} iconColor="#4CAF50" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Trạng thái</Text>
                  <Text style={[styles.infoValue, styles.activeStatus]}>Đang hoạt động</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Sign Out Button */}
        <Button 
          mode="outlined" 
          onPress={signOut} 
          style={styles.signOutButton}
          icon="logout"
          textColor="#D32F2F"
          buttonColor="transparent"
        >
          Đăng xuất
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#6750A4',
    marginRight: 16,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationButton: {
    margin: 0,
  },
  divider: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  activityCard: {
    backgroundColor: 'white',
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
    marginLeft: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: 'white',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  activeStatus: {
    color: '#4CAF50',
  },
  infoDivider: {
    marginVertical: 8,
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 32,
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
});