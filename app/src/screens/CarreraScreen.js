// src/screens/CarreraScreen.js - ACTUALIZADO CON COLORES INSTITUCIONALES CUORH
import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	StatusBar,
	Image,
	ScrollView,
	ActivityIndicator,
	Platform,
	Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
	PlayIcon,
	StarIcon,
	ClockIcon,
	HeartIcon,
} from '../../components/Icons';

// Importar stores
import useTourStore from '../stores/tourStore';
import useAnalyticsStore from '../stores/analyticsStore';

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

// Colores elegantes para las cartas de tours (Gradientes oscuros/premium)
const CARD_COLORS = [
	['#112240', '#0A1A2F'], // Azul profundo
	['#1A365D', '#0F2A4A'], // Azul medio
	['#233554', '#112240'], // Azul grisáceo
	['#0F2A4A', '#1A365D'], // Azul inverso
];

const CarreraScreen = ({ route, navigation }) => {
	const { career } = route.params || {};
	
	// Zustand stores
	const { tours, fetchTours } = useTourStore();
	const { trackScreenView, trackTourStart } = useAnalyticsStore();
	
	const [loading, setLoading] = useState(true);
	const [careerTours, setCareerTours] = useState([]);

	useEffect(() => {
		console.log('📖 CarreraScreen montada:', career?.title);
		trackScreenView(`Career_${career?.title || 'Unknown'}`);
		
		loadTours();
	}, [career]);

	// ✅ FUNCIÓN CORREGIDA: Filtrar solo tours de esta carrera
	const loadTours = async () => {
		setLoading(true);
		try {
			await fetchTours();
			
			if (career?.id || career?._id) {
				const careerId = career.id || career._id;
				
				// ✅ Filtrar SOLO los tours asignados a esta carrera
				const filtered = tours.filter(tour => {
					const tourCareerId = tour.careerId || tour.career;
					const match = String(tourCareerId) === String(careerId);
					
					if (match) {
						console.log(`✅ Tour "${tour.title}" pertenece a "${career.title}"`);
					}
					
					return match;
				});
				
				console.log(`📊 ${filtered.length} tours encontrados para "${career.title}"`);
				setCareerTours(filtered);
			} else {
				console.warn('⚠️ Carrera sin ID, mostrando todos los tours');
				setCareerTours(tours);
			}
		} catch (error) {
			console.error('❌ Error cargando tours:', error);
			setCareerTours([]);
		} finally {
			setLoading(false);
		}
	};

	// ✅ FUNCIÓN PARA NAVEGAR AL VISOR AR
	const handleTourPress = (tour) => {
		console.log('🎬 Tour seleccionado:', tour.title);
		console.log('📋 Tipo de tour:', tour.type);
		
		// Registrar analytics
		trackTourStart(tour.id || tour._id, tour.title, career?.id || career?._id);
		
		// Detectar tipo de tour
		const tourType = tour.type?.toLowerCase();
		
		if (tourType === 'vr' || tourType === '360' || tourType === 'vr360') {
			// Tours VR 360°
			console.log('🥽 Navegando a visor VR 360°');
			navigation.navigate('VR360Viewer', {
				tourId: tour.id || tour._id,
				tourTitle: tour.title,
				careerId: career?.id || career?._id,
				careerTitle: career?.title,
			});
		} else {
			// Tours 3D
			console.log('🎨 Navegando a visor 3D');
			navigation.navigate('ARViewer', {
				tourId: tour.id || tour._id,
				tourTitle: tour.title,
				careerId: career?.id || career?._id,
				careerTitle: career?.title,
			});
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

			{/* ✅ HEADER CON GRADIENTE PREMIUM */}
			<LinearGradient 
				colors={[COLORS.secondary, '#0F2A4A']} 
				style={styles.header}
			>
				<View style={styles.headerTop}>
					<TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
						<Ionicons name="arrow-back" size={24} color={COLORS.primary} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.iconCircleRight}>
						<HeartIcon size={20} color={COLORS.primary} />
					</TouchableOpacity>
				</View>

				<View style={styles.headerBody}>
					<Text style={styles.title}>{career?.title || 'Carrera'}</Text>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<StarIcon size={16} color={COLORS.primary} />
							<Text style={styles.statText}>{career?.rating || '4.8'}</Text>
						</View>
						<View style={styles.statItem}> 
							<Ionicons name="people-outline" size={16} color={COLORS.primary} />
							{/* ✅ Mostrar contador real de tours */}
							<Text style={styles.statText}>{careerTours.length} tours</Text>
						</View>
					</View>
				</View>
			</LinearGradient>

			{/* ✅ CONTENIDO CON FONDO AZUL MARINO */}
			<View style={styles.contentCard}>
				<View style={styles.tabsRow}>
					<View style={styles.tabActive}>
						<Text style={styles.tabActiveText}>Overview</Text>
					</View>
				</View>

				<ScrollView 
					style={{ marginTop: 12 }} 
					contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 80 : 60, paddingTop: 8 }}
					showsVerticalScrollIndicator={false}
				>
					{loading ? (
						<ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
					) : (
						<View style={styles.grid}>
							{/* ✅ Mensaje cuando NO hay tours asignados */}
							{careerTours.length === 0 ? (
								<View style={styles.emptyState}>
									<Ionicons name="school-outline" size={56} color={COLORS.subtext} style={{ marginBottom: 12 }} />
									<Text style={styles.emptyText}>
										Aún no hay tours para esta carrera
									</Text>
									<Text style={[styles.emptyText, { fontSize: 14, marginTop: 4, opacity: 0.7 }]}>
										Los tours se agregarán próximamente
									</Text>
								</View>
							) : (
								/* ✅ Mostrar SOLO tours asignados */
								careerTours.map((t, idx) => {
									const colors = CARD_COLORS[idx % CARD_COLORS.length];
									const badge = t.type || t.mode || 'AR';
									const progress = t.progress || Math.floor(Math.random() * 100);
									
									return (
										<TouchableOpacity 
											key={t.id || t._id || idx} 
											onPress={() => handleTourPress(t)}
											activeOpacity={0.85}
											style={{ marginBottom: 16 }}
										>
											<LinearGradient colors={colors} style={styles.card}>
												{/* Header con badge */}
												<View style={styles.cardHeader}>
													<View style={styles.cardBadge}>
														<Text style={styles.badgeText}>{badge}</Text>
													</View>
												</View>

												{/* Contenido principal */}
												<View style={styles.cardContent}>
													<Text style={styles.cardTitle}>{t.title}</Text>
													<Text style={styles.cardMeta}>
														{t.duration || 'Duración no especificada'} • 
														{t.description ? ` ${t.description.substring(0, 30)}...` : ' Experiencia inmersiva AR'}
													</Text>
												</View>

												{/* Footer con progreso y botón */}
												<View style={styles.cardFooter}>
													<View style={styles.cardProgress}>
														<Text style={styles.progressText}>
															{progress > 0 ? `${progress}% completado` : 'Nuevo'}
														</Text>
														{progress > 0 && (
															<View style={styles.progressBar}>
																<View style={[styles.progressFill, { width: `${progress}%` }]} />
															</View>
														)}
													</View>
													<TouchableOpacity 
														style={styles.playFloating}
														onPress={() => handleTourPress(t)}
														activeOpacity={0.8}
													>
														<PlayIcon size={20} color={COLORS.primary} />
													</TouchableOpacity>
												</View>
											</LinearGradient>
										</TouchableOpacity>
									);
								})
							)}
						</View>
					)}
				</ScrollView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		backgroundColor: COLORS.background,
	},
	
	// ✅ HEADER CON COLORES PREMIUM
	header: {
		minHeight: 280,
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
		paddingBottom: 60,
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.4,
		shadowRadius: 15,
		elevation: 10,
	},
	headerTop: { 
		flexDirection: 'row', 
		justifyContent: 'space-between', 
		alignItems: 'center',
		marginBottom: 10,
	},
	iconCircle: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
	},
	iconCircleRight: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.1)',
	},
	headerBody: { 
		marginTop: 10,
		flex: 1,
		justifyContent: 'flex-end',
		paddingBottom: 10,
	},
	title: { 
		color: COLORS.primary, 
		fontSize: SCREEN_WIDTH < 380 ? 26 : 32,
		fontWeight: '800', 
		marginBottom: 16,
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
		letterSpacing: 0.5,
		lineHeight: SCREEN_WIDTH < 380 ? 32 : 40,
	},
	statsRow: { 
		flexDirection: 'row', 
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: 12,
	},
	statItem: { 
		flexDirection: 'row', 
		alignItems: 'center', 
		backgroundColor: 'rgba(10, 26, 47, 0.5)',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: 'rgba(212, 175, 55, 0.3)',
	},
	statText: { 
		color: COLORS.text, 
		marginLeft: 8,
		fontSize: 13,
		fontWeight: '600',
	},

	// ✅ CONTENIDO
	contentCard: {
		flex: 1,
		marginTop: -40,
		paddingHorizontal: 16,
	},
	tabsRow: { 
		flexDirection: 'row', 
		backgroundColor: COLORS.card, 
		borderRadius: 16, 
		overflow: 'hidden', 
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.05)',
	},
	tabActive: { 
		flex: 1, 
		padding: 16, 
		alignItems: 'center', 
		borderBottomColor: COLORS.primary,
		borderBottomWidth: 3,
		backgroundColor: 'rgba(212, 175, 55, 0.05)',
	},
	tabActiveText: { 
		color: COLORS.primary, 
		fontWeight: '700',
		fontSize: 15,
	},
	tabInactive: { 
		flex: 1, 
		padding: 16, 
		alignItems: 'center',
	},
	tabInactiveText: { 
		color: COLORS.subtext, 
		fontWeight: '600',
		fontSize: 15,
	},

	// ✅ GRID DE TOURS
	grid: { 
		marginTop: 16, 
		paddingHorizontal: 4,
	},
	card: {
		width: '100%',
		height: 190,
		borderRadius: 18,
		padding: 20,
		marginBottom: 18,
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 12,
		elevation: 8,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.05)',
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	cardBadge: {
		backgroundColor: 'rgba(10, 26, 47, 0.8)',
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.primary,
	},
	badgeText: { 
		fontSize: 12, 
		fontWeight: '700', 
		color: COLORS.primary,
		letterSpacing: 0.5,
		textTransform: 'uppercase',
	},
	cardContent: {
		flex: 1,
		justifyContent: 'center',
	},
	cardTitle: { 
		color: COLORS.text, 
		fontSize: 19, 
		fontWeight: '700',
		marginBottom: 8,
		lineHeight: 26,
		textShadowColor: 'rgba(0,0,0,0.5)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	cardMeta: { 
		color: COLORS.subtext, 
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 20,
	},
	cardFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 16,
	},
	cardProgress: {
		flex: 1,
		marginRight: 14,
	},
	progressText: {
		color: COLORS.subtext,
		fontSize: 11,
		marginBottom: 6,
		fontWeight: '600',
		textTransform: 'uppercase',
	},
	progressBar: {
		height: 4,
		backgroundColor: 'rgba(255,255,255,0.1)',
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: COLORS.primary,
		borderRadius: 2,
	},
	playFloating: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(212, 175, 55, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: COLORS.primary,
		shadowColor: COLORS.primary,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.4,
		shadowRadius: 8,
		elevation: 6,
	},
	
	// ✅ EMPTY STATE
	emptyState: {
		width: '100%',
		paddingVertical: 70,
		alignItems: 'center',
		backgroundColor: COLORS.card,
		borderRadius: 18,
		marginTop: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
		elevation: 4,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.05)',
	},
	emptyText: {
		fontSize: 16,
		color: COLORS.text,
		textAlign: 'center',
		fontWeight: '600',
		marginTop: 12,
		paddingHorizontal: 24,
	},
});

export default CarreraScreen;