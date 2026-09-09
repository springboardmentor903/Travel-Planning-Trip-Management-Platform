package com.tripnest.tripnest_backend.config;

import com.tripnest.tripnest_backend.entity.Attraction;
import com.tripnest.tripnest_backend.entity.Destination;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final AttractionRepository attractionRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> DEFAULT_ROLES = List.of("TRAVELER", "GROUP_ADMIN", "ADMINISTRATOR");
    private static final String DEFAULT_ADMIN_EMAIL = "admin@tripnest.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";

    @Override
    public void run(String... args) {
        DEFAULT_ROLES.forEach(roleName -> {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
        });

        seedDestinations();
        seedAttractions();

        // 1. Seed or reset Admin user
        Role adminRole = roleRepository.findByName("ADMINISTRATOR")
                .orElseThrow(() -> new RuntimeException("ADMINISTRATOR role missing after seeding"));

        Optional<User> adminOpt = userRepository.findByEmail(DEFAULT_ADMIN_EMAIL);
        User admin;
        if (adminOpt.isPresent()) {
            admin = adminOpt.get();
        } else {
            admin = new User();
            admin.setName("Default Administrator");
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setOauthGoogle(false);
        }
        admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
        admin.setRole(adminRole);
        userRepository.save(admin);

        // 2. Seed or reset Demo Traveler user
        Role travelerRole = roleRepository.findByName("TRAVELER")
                .orElseThrow(() -> new RuntimeException("TRAVELER role missing after seeding"));

        Optional<User> userOpt = userRepository.findByEmail("user@tripnest.com");
        User traveler;
        if (userOpt.isPresent()) {
            traveler = userOpt.get();
        } else {
            traveler = new User();
            traveler.setName("Demo Traveler");
            traveler.setEmail("user@tripnest.com");
            traveler.setOauthGoogle(false);
            traveler.setBio("Passionate explorer and travel enthusiast.");
        }
        traveler.setPasswordHash(passwordEncoder.encode("User@123"));
        traveler.setRole(travelerRole);
        userRepository.save(traveler);
    }

    private void seedDestinations() {
        if (destinationRepository.count() == 0) {
            destinationRepository.save(new Destination(null, "Paris", "France", "City of Light and iconic Eiffel Tower", "Sunny 22°C", true));
            destinationRepository.save(new Destination(null, "Bali", "Indonesia", "Tropical paradise with beaches and temples", "Tropical 29°C", true));
            destinationRepository.save(new Destination(null, "Tokyo", "Japan", "Vibrant metropolis blending tradition and future", "Clear 19°C", true));
            destinationRepository.save(new Destination(null, "Rome", "Italy", "Historic capital with Ancient Colosseum", "Warm 26°C", true));
            destinationRepository.save(new Destination(null, "New York", "USA", "The city that never sleeps", "Breezy 21°C", true));
            destinationRepository.save(new Destination(null, "Bangalore", "India", "Garden City & Silicon Valley of India with IT parks and historic palaces", "Pleasant 24°C", false));
            destinationRepository.save(new Destination(null, "London", "UK", "Historic capital with Big Ben, Tower Bridge and royal palaces", "Mild 18°C", false));
            destinationRepository.save(new Destination(null, "Mumbai", "India", "Financial capital of India famous for Bollywood and Marine Drive", "Warm 30°C", false));
            destinationRepository.save(new Destination(null, "Mysuru", "India", "Heritage city of Karnataka renowned for Mysore Palace and Silk", "Pleasant 26°C", false));
            destinationRepository.save(new Destination(null, "Madurai", "India", "Ancient temple city famous for Meenakshi Amman Temple", "Warm 32°C", false));
        }
    }

    private void seedAttractions() {
        List<Destination> destinations = destinationRepository.findAll();
        for (Destination d : destinations) {
            String nameLower = d.getName().toLowerCase();
            if (nameLower.contains("paris")) {
                seedAttraction(d, "Eiffel Tower", "One of Paris's most iconic landmarks, the Eiffel Tower offers spectacular views across the city from its observation levels. It is especially popular with visitors for its architecture, history, and panoramic views.");
                seedAttraction(d, "Louvre Museum", "One of the world's largest art museums, housed in a historic palace and famous for housing the Mona Lisa. Visitors can explore thousands of classic and modern masterpieces.");
                seedAttraction(d, "Notre-Dame Cathedral", "Masterpiece of French Gothic architecture known for its impressive rose windows, sculptures, and historic significance on the Île de la Cité.");
                seedAttraction(d, "Arc de Triomphe", "Historic monumental arch at the western end of the Champs-Élysées, honoring those who fought for France with an observation deck overlooking twelve avenues.");
                seedAttraction(d, "Sacré-Cœur Basilica", "Stunning Roman Catholic church located at the highest point in Paris on the summit of Montmartre, known for its white domes and city view.");
            } else if (nameLower.contains("bali")) {
                seedAttraction(d, "Tanah Lot", "Ancient Hindu shrine perched on a dramatic offshore rock formation, famous for ocean views and spectacular sunsets. It remains one of Bali's most revered coastal temples.");
                seedAttraction(d, "Uluwatu Temple", "Balinese sea temple perched atop a steep cliff approximately 70 meters above the Indian Ocean, celebrated for traditional Kecak fire dance performances.");
                seedAttraction(d, "Tegallalang Rice Terraces", "Famous series of beautifully terraced paddy fields offering scenic valley views, traditional subak irrigation systems, and jungle swings.");
                seedAttraction(d, "Ubud Monkey Forest", "Natural sanctuary and temple complex home to hundreds of sacred Balinese long-tailed macaques nestled within lush tropical forest.");
                seedAttraction(d, "Mount Batur", "Active volcano popular for early morning sunrise trekking, offering panoramic views of Lake Batur and surrounding island highlands.");
            } else if (nameLower.contains("tokyo")) {
                seedAttraction(d, "Senso-ji Temple", "Tokyo's oldest and most significant Buddhist temple located in Asakusa with its iconic Kaminarimon Gate and Nakamise shopping street.");
                seedAttraction(d, "Tokyo Skytree", "Tallest structure in Japan featuring observation decks with breathtaking 360-degree views of the Tokyo metropolis and Mount Fuji on clear days.");
                seedAttraction(d, "Meiji Shrine", "Tranquil Shinto shrine dedicated to Emperor Meiji, surrounded by a lush forest of over 100,000 trees in the heart of Shibuya.");
                seedAttraction(d, "Shibuya Crossing", "World-famous scramble intersection known for its bustling pedestrian energy, neon billboard displays, and vibrant urban culture.");
                seedAttraction(d, "Imperial Palace", "Primary residence of the Emperor of Japan, set amidst extensive historic parkland, ancient moats, and stone bridges.");
            } else if (nameLower.contains("rome")) {
                seedAttraction(d, "Colosseum", "Iconic ancient Roman amphitheater that once hosted gladiatorial contests and public spectacles, standing as a monument to ancient engineering.");
                seedAttraction(d, "Pantheon", "Former Roman temple turned church, celebrated for its magnificent unreinforced concrete domed roof and ancient marble interior.");
                seedAttraction(d, "Trevi Fountain", "World-famous Baroque fountain where travelers toss coins to ensure their return to Rome, adorned with sculptures of Oceanus.");
                seedAttraction(d, "Vatican Museums & Sistine Chapel", "Renowned global art collection containing Michelangelo's masterpiece ceiling in the Sistine Chapel and classic Renaissance sculptures.");
                seedAttraction(d, "Roman Forum", "Historic plaza surrounded by the ruins of several ancient government buildings at the center of ancient Roman civilization.");
            } else if (nameLower.contains("new york") || nameLower.contains("nyc")) {
                seedAttraction(d, "Statue of Liberty", "Colossal neoclassical sculpture on Liberty Island representing freedom and welcoming visitors to New York Harbor.");
                seedAttraction(d, "Central Park", "Vast urban oasis featuring scenic walking paths, serene lakes, ice rinks, historic bridges, and open lawns in Manhattan.");
                seedAttraction(d, "Empire State Building", "Art Deco skyscraper in Midtown Manhattan offering famous open-air observatory views across New York City.");
                seedAttraction(d, "Times Square", "Major commercial intersection brightened by massive digital billboards, Broadway theaters, and non-stop street energy.");
                seedAttraction(d, "Metropolitan Museum of Art", "One of the world's largest and finest art museums, spanning over 5,000 years of global culture and historical artifacts.");
            } else if (nameLower.contains("bangalore") || nameLower.contains("bengaluru")) {
                seedAttraction(d, "Bangalore Palace", "Historic royal palace inspired by England's Windsor Castle, featuring Tudor-style architecture, wooden carvings, and lush gardens.");
                seedAttraction(d, "Lalbagh Botanical Garden", "Famous 240-acre botanical garden featuring a historic glass house inspired by London's Crystal Palace and rare tropical plants.");
                seedAttraction(d, "Cubbon Park", "Lush green sanctuary in the city center featuring tree-lined avenues, historic red heritage buildings, and peaceful walking tracks.");
                seedAttraction(d, "Vidhana Soudha", "Imposing seat of the state legislature of Karnataka, built in the grand Neo-Dravidian architectural style with floodlit night views.");
                seedAttraction(d, "ISKCON Temple", "Sprawling cultural and spiritual complex dedicated to Lord Krishna located on a hilltop in Rajajinagar with modern amenities.");
            } else if (nameLower.contains("london")) {
                seedAttraction(d, "Big Ben & Parliament", "Historic clock tower and seat of the UK Parliament situated along the River Thames, iconic to London's skyline.");
                seedAttraction(d, "Tower Bridge", "Iconic Victorian suspension and bascule bridge spanning the River Thames with high-level glass walkways and twin stone towers.");
                seedAttraction(d, "British Museum", "World-class museum dedicated to human history, art, and culture housing famous artifacts like the Rosetta Stone and Egyptian mummies.");
                seedAttraction(d, "Buckingham Palace", "Official London residence and administrative headquarters of the UK monarch, famous for the Changing of the Guard ceremony.");
                seedAttraction(d, "London Eye", "Giant observation wheel on the South Bank of the River Thames offering 30-minute rotation panoramic views across the capital.");
            } else if (nameLower.contains("mumbai")) {
                seedAttraction(d, "Gateway of India", "Bold waterfront arch monument built in the early 20th century overlooking the Arabian Sea, serving as Mumbai's chief landmark.");
                seedAttraction(d, "Marine Drive", "Picturesque 3.6-kilometer-long boulevard along the coast of South Mumbai, famously known as the Queen's Necklace when lit at night.");
                seedAttraction(d, "Chhatrapati Shivaji Maharaj Terminus", "Historic UNESCO World Heritage railway station showcasing Victorian Gothic revival architecture and intricate stone carvings.");
                seedAttraction(d, "Elephanta Caves", "UNESCO-listed rock-cut cave temples dedicated to Lord Shiva located on Elephanta Island in Mumbai Harbour.");
                seedAttraction(d, "Siddhivinayak Temple", "Grand Hindu temple dedicated to Lord Ganesha, one of the richest and most visited spiritual sites in Mumbai.");
            } else if (nameLower.contains("mysur") || nameLower.contains("mysore")) {
                seedAttraction(d, "Mysore Palace", "Magnificent royal residence of the Wadiyar dynasty, beautifully illuminated with thousands of lights on Sunday evenings and festivals.");
                seedAttraction(d, "Chamundi Hill", "Prominent hill overlooking Mysuru, topped by the ancient Chamundeshwari Temple and a giant Nandi monolith.");
                seedAttraction(d, "Brindavan Gardens", "Terraced garden built adjoining the Krishnarajasagara Dam, famous for symmetrical fountains and evening musical light shows.");
                seedAttraction(d, "St. Philomena's Cathedral", "Neo-Gothic church featuring tall twin spires and stained-glass windows depicting significant scenes from the life of Christ.");
            } else if (nameLower.contains("madurai")) {
                seedAttraction(d, "Meenakshi Amman Temple", "Historic Hindu temple complex located on the southern bank of the Vaigai River, renowned for its towering colorful gopurams.");
                seedAttraction(d, "Thirumalai Nayakkar Palace", "17th-century palace built by King Thirumalai Nayak, featuring grand stucco pillars and classic Dravidian-Italian fusion architecture.");
                seedAttraction(d, "Gandhi Memorial Museum", "Historic museum documenting India's freedom struggle and housing original artifacts of Mahatma Gandhi in a royal palace.");
                seedAttraction(d, "Alagar Koyil", "Vishnu temple situated at the foothills of Solaimalai, known for intricate stone carvings, holy springs, and forest surroundings.");
            } else if (nameLower.contains("delhi")) {
                seedAttraction(d, "Red Fort", "Historic 17th-century Mughal fortress constructed from red sandstone, serving as an iconic symbol of India's national heritage.");
                seedAttraction(d, "Qutub Minar", "UNESCO World Heritage Site featuring a 73-meter tall red sandstone minaret surrounded by ancient iron pillars and ruins.");
                seedAttraction(d, "India Gate", "Imposing 42-meter high war memorial arch paying tribute to fallen soldiers, surrounded by sprawling fountains and lawns.");
            } else if (nameLower.contains("goa")) {
                seedAttraction(d, "Calangute & Baga Beaches", "Famous golden sand beaches along the Arabian Sea known for watersports, beach shacks, and vibrant coastal dining.");
                seedAttraction(d, "Basilica of Bom Jesus", "UNESCO World Heritage church in Old Goa housing the sacred relics of St. Francis Xavier, showcasing Portuguese Baroque architecture.");
            }
        }

        // Guaranteed Enforcement: Ensure EVERY destination in the database has AT LEAST 2 attractions
        for (Destination d : destinationRepository.findAll()) {
            List<Attraction> currentList = attractionRepository.findByDestinationId(d.getId());
            if (currentList.size() < 2) {
                if (currentList.isEmpty()) {
                    seedAttraction(d, d.getName() + " Central Square & Historic Landmark",
                            "The vibrant cultural heart of " + d.getName() + ", featuring historic architecture, open-air plazas, local craft markets, and rich regional heritage.");
                    seedAttraction(d, d.getName() + " Botanical Gardens & City Park",
                            "A peaceful urban green sanctuary in " + d.getName() + " offering scenic walking paths, native flora, and picturesque natural views for visitors.");
                } else if (currentList.size() == 1) {
                    Attraction existing = currentList.get(0);
                    String secondName = existing.getName().contains("Heritage") ? d.getName() + " City Viewpoint & Park" : d.getName() + " Cultural Heritage Museum";
                    seedAttraction(d, secondName,
                            "Premier landmark in " + d.getName() + " showcasing historical artifacts, fine regional art, and panoramic scenic views for travelers.");
                }
            }
        }

        // Global Sweep: Guarantee every single attraction record in the database has a valid, meaningful description
        List<Attraction> allAttractions = attractionRepository.findAll();
        for (Attraction a : allAttractions) {
            if (a.getShortDescription() == null || a.getShortDescription().trim().isEmpty()) {
                String destName = (a.getDestination() != null) ? a.getDestination().getName() : "the destination";
                a.setShortDescription("Famous point of interest in " + destName + " offering unique cultural, architectural, and historical significance for visitors.");
                attractionRepository.save(a);
            }
        }
    }

    private void seedAttraction(Destination destination, String name, String shortDescription) {
        Optional<Attraction> existingOpt = attractionRepository.findByDestinationIdAndNameIgnoreCase(destination.getId(), name);
        if (existingOpt.isPresent()) {
            Attraction existing = existingOpt.get();
            if (existing.getShortDescription() == null || existing.getShortDescription().trim().isEmpty()) {
                existing.setShortDescription(shortDescription);
                attractionRepository.save(existing);
            }
        } else {
            Attraction attraction = Attraction.builder()
                    .destination(destination)
                    .name(name.trim())
                    .shortDescription(shortDescription.trim())
                    .build();
            attractionRepository.save(attraction);
        }
    }
}
