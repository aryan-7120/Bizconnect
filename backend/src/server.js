const app = require('./app');
const connectDB = require('./config/db');
const Category = require('./models/Category');

const PORT = process.env.PORT || 5000;

// Default categories seed
const seedCategories = async () => {
  const count = await Category.countDocuments();
  if (count === 0) {
    const categories = [
      { name: 'Salon', slug: 'salon', icon: '💇' },
      { name: 'Hospital', slug: 'hospital', icon: '🏥' },
      { name: 'Dentist', slug: 'dentist', icon: '🦷' },
      { name: 'Gym', slug: 'gym', icon: '💪' },
      { name: 'Restaurant', slug: 'restaurant', icon: '🍽️' },
      { name: 'Tutor', slug: 'tutor', icon: '📚' },
      { name: 'Mechanic', slug: 'mechanic', icon: '🔧' },
      { name: 'Lawyer', slug: 'lawyer', icon: '⚖️' },
      { name: 'Photographer', slug: 'photographer', icon: '📷' },
      { name: 'Spa', slug: 'spa', icon: '🧖' },
      { name: 'Fitness Trainer', slug: 'fitness-trainer', icon: '🏋️' },
      { name: 'Other', slug: 'other', icon: '🏢' },
    ];
    await Category.insertMany(categories);
    console.log('✅ Default categories seeded.');
  }
};

const start = async () => {
  await connectDB();
  await seedCategories();
  app.listen(PORT, () => {
    console.log(`🚀 BizConnect API running on http://localhost:${PORT}`);
    console.log(`📖 Swagger docs: http://localhost:${PORT}/api/docs`);
  });
};

start();
