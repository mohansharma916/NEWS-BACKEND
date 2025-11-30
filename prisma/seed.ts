// // prisma/seed.ts

// // import { PrismaClient, Role, PostStatus } from '@prisma/client';
// import { PrismaClient,PostStatus,Role } from 'generated/prisma/client';
// import { faker } from '@faker-js/faker';
// import { PrismaPg } from '@prisma/adapter-pg'

// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
// const prisma = new PrismaClient({ adapter })

// // Helper to make URL-friendly slugs
// const slugify = (text: string) => {
//   return text
//     .toString()
//     .toLowerCase()
//     .trim()
//     .replace(/\s+/g, '-')     // Replace spaces with -
//     .replace(/[^\w\-]+/g, '') // Remove all non-word chars
//     .replace(/\-\-+/g, '-')   // Replace multiple - with single -
//     .replace(/^-+/, '')       // Trim - from start of text
//     .replace(/-+$/, '');      // Trim - from end of text
// };
// async function main() {
//   console.log('🌱 Starting seeding...');

//   // 1. Create Categories (Based on your UI)
//   const categoryNames = [
//     'India', 'World', 'Local', 'Business', 
//     'Technology', 'Entertainment', 'Sports', 'Science', 'Health'
//   ];

//   const categories = [];
//   for (const name of categoryNames) {
//     const category = await prisma.category.upsert({
//       where: { name },
//       update: {},
//       create: {
//         name,
//         slug: slugify(name),
//         description: `News and updates about ${name}`,
//       },
//     });
//     categories.push(category);
//   }
//   console.log(`✅ Created ${categories.length} categories.`);

//   // 2. Create a Dummy Admin User (Author)
//   const adminUser = await prisma.user.upsert({
//     where: { email: 'admin@viewisland.com' },
//     update: {},
//     create: {
//       email: 'admin@viewisland.com',
//       password: 'hashedpassword123', // In real app, hash this!
//       fullName: 'Chief Editor',
//       role: Role.SUPER_ADMIN,
//       avatarUrl: faker.image.avatar(),
//     },
//   });
//   console.log(`✅ Created Admin user: ${adminUser.email}`);

//   // 3. Create 200 Fake Posts
//   console.log('📝 Generating 200 posts...');
  
//   for (let i = 0; i < 200; i++) {
//     const title = faker.lorem.sentence({ min: 6, max: 12 });
//     // Randomly pick a category
//     const randomCategory = categories[Math.floor(Math.random() * categories.length)];
//     // Random status (mostly PUBLISHED)
//     const status = Math.random() > 0.1 ? PostStatus.PUBLISHED : PostStatus.DRAFT;
//     const isTrending = Math.random() > 0.9; // 10% chance to be trending
//     const views = faker.number.int({ min: 0, max: 50000 });

//     await prisma.post.create({
//       data: {
//         title: title.replace('.', ''), // Remove trailing dot
//         slug: `${slugify(title)}-${faker.string.alphanumeric(5)}`, // Ensure unique slug
//         excerpt: faker.lorem.paragraph(2),
//         content: `
//           <p>${faker.lorem.paragraph(4)}</p>
//           <h2>${faker.lorem.sentence()}</h2>
//           <p>${faker.lorem.paragraph(4)}</p>
//           <blockquote>${faker.lorem.sentence()}</blockquote>
//           <p>${faker.lorem.paragraph(3)}</p>
//         `,
//         coverImage: faker.image.urlLoremFlickr({ category: 'technology,business,city' }), 
//         views: views,
//         isTrending: isTrending,
//         status: status,
//         publishedAt: status === PostStatus.PUBLISHED ? faker.date.past() : null,
//         authorId: adminUser.id,
//         categoryId: randomCategory.id,
//       },
//     });
//   }

//   console.log('✅ Seeding finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });