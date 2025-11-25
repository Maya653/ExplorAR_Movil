// src/screens/Guardados.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
import React from 'react';
import { 
	View, 
	Text, 
	StyleSheet, 
	TouchableOpacity, 
	Image, 
	ScrollView, 
	SafeAreaView, 
	StatusBar,
	Platform,
	Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useHiddenStore from '../stores/hiddenStore';

// ✅ COLORES PREMIUM (Azul y Dorado)
const COLORS = {
  primary: '#D4AF37',      // Dorado Premium
  secondary: '#0A1A2F',    // Azul Oscuro Profundo
  background: '#0A1A2F',   // Fondo Principal
  card: '#112240',         // Fondo de Tarjetas
  text: '#E6F1FF',         // Texto Principal (Blanco Azulado)
  subtext: '#8892B0',      // Texto Secundario (Gris Azulado)
  accent: '#64FFDA',       // Acento (Cyan Brillante para detalles)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: 'rgba(212, 175, 55, 0.2)', // Borde dorado sutil
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Guardados = ({ navigation }) => {
	const hiddenTours = useHiddenStore((s) => s.hiddenTours);
	const hiddenTestimonials = useHiddenStore((s) => s.hiddenTestimonials);
	const restoreTour = useHiddenStore((s) => s.restoreTour);
	const restoreTestimonial = useHiddenStore((s) => s.restoreTestimonial);

	const handleRestoreTour = (id) => {
		restoreTour(id);
		navigation.navigate('Home');
	};

	const handleRestoreTestimonial = (id) => {
		restoreTestimonial(id);
		navigation.navigate('Home');
	};

	const isEmpty = hiddenTours.length === 0 && hiddenTestimonials.length === 0;

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
			
			{/* ✅ HEADER PREMIUM */}
			<LinearGradient
				colors={[COLORS.secondary, '#0F2A4A']}
				style={styles.header}
			>
				<Text style={styles.title}>Guardados</Text>
				<TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeButton}>
					<Ionicons name="home-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
					<Text style={styles.link}>Inicio</Text>
				</TouchableOpacity>
			</LinearGradient>

			{isEmpty ? (
				<View style={styles.emptyBox}>
					<Ionicons name="bookmark-outline" size={64} color={COLORS.subtext} style={{ marginBottom: 20 }} />
					<Text style={styles.emptyText}>No hay elementos guardados</Text>
					<Text style={styles.emptySubtext}>
						Los elementos que ocultes aparecerán aquí
					</Text>
				</View>
			) : (
				<ScrollView 
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* Tours ocultos */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Ionicons name="cube-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
							<Text style={styles.sectionTitle}>Tours ocultos</Text>
						</View>
						{hiddenTours.length === 0 ? (
							<Text style={styles.smallMuted}>No hay tours ocultos</Text>
						) : (
							hiddenTours.map((tour) => (
								<View key={tour.id} style={styles.card}>
									<Image
										source={
											tour.image
												? (typeof tour.image === 'string' ? { uri: tour.image } : tour.image)
												: { uri: 'https://img.icons8.com/color/96/courthouse.png' }
										}
										style={styles.thumb}
									/>
									<View style={styles.info}>
										<Text style={styles.cardTitle} numberOfLines={2}>
											{tour.title || 'Tour'}
										</Text>
										<TouchableOpacity 
											style={styles.actionBtn} 
											onPress={() => handleRestoreTour(tour.id)}
										>
											<Ionicons name="refresh-outline" size={16} color={COLORS.background} style={{ marginRight: 4 }} />
											<Text style={styles.actionText}>Restaurar</Text>
										</TouchableOpacity>
									</View>
								</View>
							))
						)}
					</View>

					{/* Testimonios ocultos */}
					<View style={styles.section}>
						<View style={styles.sectionHeader}>
							<Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
							<Text style={styles.sectionTitle}>Testimonios ocultos</Text>
						</View>
						{hiddenTestimonials.length === 0 ? (
							<Text style={styles.smallMuted}>No hay testimonios ocultos</Text>
						) : (
							hiddenTestimonials.map((t) => (
								<View key={t.id} style={styles.card}>
									<Image
										source={
											t.authorImage 
												? (typeof t.authorImage === 'string' ? { uri: t.authorImage } : t.authorImage) 
												: require('../../assets/homescreen.png')
										}
										style={styles.thumb}
									/>
									<View style={styles.info}>
										<Text style={styles.cardTitle} numberOfLines={2}>
											{t.author || t.autor || 'Anónimo'}
										</Text>
										<TouchableOpacity 
											style={styles.actionBtn} 
											onPress={() => handleRestoreTestimonial(t.id)}
										>
											<Ionicons name="refresh-outline" size={16} color={COLORS.background} style={{ marginRight: 4 }} />
											<Text style={styles.actionText}>Restaurar</Text>
										</TouchableOpacity>
									</View>
								</View>
							))
						)}
					</View>

					{/* Espaciado final */}
					<View style={{ height: Platform.OS === 'ios' ? 40 : 24 }} />
				</ScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	
	// ✅ HEADER PREMIUM
	header: {
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
		paddingBottom: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: '800',
		color: COLORS.text,
		letterSpacing: 0.5,
	},
	homeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: 'rgba(212, 175, 55, 0.3)',
	},
	link: {
		fontSize: 14,
		fontWeight: '600',
		color: COLORS.text,
	},
	
	// ✅ EMPTY STATE
	emptyBox: {
		flex: 1,
		marginTop: 80,
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyText: {
		fontSize: 20,
		fontWeight: '700',
		color: COLORS.text,
		textAlign: 'center',
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 15,
		color: COLORS.subtext,
		textAlign: 'center',
		lineHeight: 22,
	},
	
	// ✅ CONTENT
	content: {
		paddingHorizontal: 16,
		paddingTop: 24,
		paddingBottom: 32,
	},
	section: {
		marginBottom: 28,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(212, 175, 55, 0.3)',
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: COLORS.primary,
		letterSpacing: 0.5,
	},
	smallMuted: {
		fontSize: 14,
		color: COLORS.subtext,
		marginBottom: 12,
		fontStyle: 'italic',
		textAlign: 'center',
		marginTop: 10,
	},
	
	// ✅ CARDS
	card: {
		flexDirection: 'row',
		backgroundColor: COLORS.card,
		borderRadius: 16,
		padding: 12,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 6,
		elevation: 4,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.05)',
	},
	thumb: {
		width: 70,
		height: 70,
		borderRadius: 12,
		marginRight: 14,
		backgroundColor: COLORS.background,
	},
	info: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: COLORS.text,
		flex: 1,
		paddingRight: 12,
		lineHeight: 22,
	},
	actionBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.primary,
		borderRadius: 12,
		paddingVertical: 8,
		paddingHorizontal: 12,
		shadowColor: COLORS.primary,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 3,
	},
	actionText: {
		color: COLORS.background,
		fontWeight: '700',
		fontSize: 12,
	},
});

export default Guardados;