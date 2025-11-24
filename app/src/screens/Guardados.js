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
import useHiddenStore from '../stores/hiddenStore';

// ✅ COLORES INSTITUCIONALES CUORH
const COLORS = {
	primary: '#8A8D00',      // PANTONE 392 C - Verde olivo
	secondary: '#041E42',    // PANTONE 296 C - Azul marino
	white: '#FFFFFF',
	lightText: '#E5E7EB',
	mutedText: '#9CA3AF',
	accent: '#4F46E5',
	success: '#10B981',
	warning: '#F59E0B',
	error: '#EF4444',
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
			<StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
			
			{/* ✅ HEADER CON COLOR INSTITUCIONAL */}
			<View style={styles.header}>
				<Text style={styles.title}>Guardados</Text>
				<TouchableOpacity onPress={() => navigation.navigate('Home')}>
					<Text style={styles.link}>Volver a Home</Text>
				</TouchableOpacity>
			</View>

			{isEmpty ? (
				<View style={styles.emptyBox}>
					<Text style={styles.emptyIcon}>📌</Text>
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
						<Text style={styles.sectionTitle}>Tours ocultos</Text>
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
											<Text style={styles.actionText}>Restaurar</Text>
										</TouchableOpacity>
									</View>
								</View>
							))
						)}
					</View>

					{/* Testimonios ocultos */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Testimonios ocultos</Text>
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
		backgroundColor: COLORS.secondary,
	},
	
	// ✅ HEADER CON COLOR INSTITUCIONAL
	header: {
		backgroundColor: COLORS.primary,
		paddingHorizontal: 16,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 50,
		paddingBottom: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: COLORS.white,
	},
	link: {
		fontSize: 14,
		fontWeight: '600',
		color: COLORS.white,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 12,
	},
	
	// ✅ EMPTY STATE
	emptyBox: {
		flex: 1,
		marginTop: 80,
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	emptyIcon: {
		fontSize: 64,
		marginBottom: 20,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		color: COLORS.lightText,
		textAlign: 'center',
		marginBottom: 8,
	},
	emptySubtext: {
		fontSize: 14,
		color: COLORS.mutedText,
		textAlign: 'center',
	},
	
	// ✅ CONTENT
	content: {
		paddingHorizontal: 16,
		paddingTop: 20,
		paddingBottom: 24,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: COLORS.white,
		marginBottom: 12,
		paddingBottom: 8,
		borderBottomWidth: 2,
		borderBottomColor: COLORS.primary,
	},
	smallMuted: {
		fontSize: 14,
		color: COLORS.mutedText,
		marginBottom: 12,
		fontStyle: 'italic',
	},
	
	// ✅ CARDS
	card: {
		flexDirection: 'row',
		backgroundColor: COLORS.white,
		borderRadius: 14,
		padding: 14,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
		alignItems: 'center',
	},
	thumb: {
		width: 64,
		height: 64,
		borderRadius: 12,
		marginRight: 14,
	},
	info: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: COLORS.secondary,
		flex: 1,
		paddingRight: 12,
		lineHeight: 20,
	},
	actionBtn: {
		backgroundColor: COLORS.success,
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	actionText: {
		color: COLORS.white,
		fontWeight: '700',
		fontSize: 13,
	},
});

export default Guardados;