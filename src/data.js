import heroImg from './assets/main.jpg';

export const profile = {
    name: 'Yahya El Gzouli',
    title: 'Full-Stack Software Engineer | 4th Year Computer Engineering Student',
    subtitle: 'Oujda, Morocco | Age: 23 | +212 654495827',
    avatar: heroImg,
    social: {
        linkedin: 'https://www.linkedin.com/in/yahya-el-gzouli-99536b331',
        github: 'https://github.com/yahyaegz',
        twitter: 'https://x.com/YahyaEgz?t=1w_Suv18laykjv_2GtumTQ&s=09',
        instagram: 'https://www.instagram.com/arty7ya_?igshid=anB3cDR5am9tNjlx',
    },
    summary: `Results-driven Full-Stack Software Engineer with expertise in developing scalable and high-performance web applications using React, Node.js, ASP.NET Core, and SQL-based databases. Skilled in RESTful API design, cloud deployment, and database optimization. Committed to clean architecture, secure authentication systems, and agile team collaboration. Passionate about building innovative solutions and pushing boundaries in technology.`,
};

export const topSkills = [
    'Full-Stack Development',
    'RESTful API Design',
    'Database Optimization',
];

export const coreCompetencies = [
    'Full-Stack Development',
    'RESTful API Design',
    'ASP.NET Core',
    'Database Optimization',
    'JWT Authentication',
    'Cloud Deployment (AWS & Azure)',
    'Agile Collaboration',
    'Version Control (Git)',
    'Machine Learning & AI',
    'Deep Learning & Neural Networks',
    'Data Analysis & Visualization',
    'Natural Language Processing',
];

export const certifications = [
    {
        category: 'HackerRank',
        items: [
            {
                name: 'REST API (Intermediate)',
                issued: 'Jan 2026',
                type: 'Certification',
                skills: ['Node.js', 'REST API', 'Backend Development'],
                credentialUrl: 'https://www.hackerrank.com/certificates/c0ecd660e9fd',
                icon: 'code'
            },
            {
                name: 'Node.js (Intermediate)',
                issued: 'Jan 2026',
                type: 'Certification',
                skills: ['Node.js', 'Back-End Web Development'],
                credentialUrl: 'https://www.hackerrank.com/certificates/6d628d72294c',
                icon: 'node',
                brand: true
            },
            {
                name: 'Software Engineer',
                issued: 'Jan 2026',
                type: 'Role',
                skills: ['SQL', 'Python'],
                credentialUrl: 'https://www.hackerrank.com/certificates/b56d56822f0b',
                icon: 'code'
            },
            {
                name: 'Frontend Developer (React)',
                issued: 'Jan 2026',
                type: 'Role',
                skills: ['Responsive Web Design', 'Front-end Engineering', 'React.js', 'HTML5', 'CSS3'],
                credentialUrl: 'https://www.hackerrank.com/certificates/0956640b3b1a',
                icon: 'react',
                brand: true
            },
            {
                name: 'SQL (Advanced)',
                issued: 'Nov 2024',
                type: 'Skill Badge',
                skills: ['SQL', 'Database Management'],
                credentialUrl: 'https://www.hackerrank.com/certificates/1a4bcd84e90a',
                icon: 'database'
            },
            {
                name: 'Problem Solving (Intermediate)',
                issued: 'Nov 2024',
                credentialId: 'Problem Solving (Intermediate)',
                type: 'Skill Badge',
                skills: ['Problem Solving', 'Algorithm Design'],
                credentialUrl: 'https://www.hackerrank.com/certificates/81fa1e0c4c38',
                icon: 'brain'
            },
        ]
    },
    {
        category: 'Codédex',
        items: [
            {
                name: 'The Origins III: JavaScript',
                issued: 'Nov 2024',
                credentialId: '123680166',
                type: 'Course',
                skills: ['Front-end Engineering', 'JavaScript', 'ES6+'],
                credentialUrl: 'https://www.credential.net/44ae770c-260f-4732-8d0e-2d40991a8f13#acc.R7Ek5r14',
                icon: 'code'
            },
            {
                name: 'The Origins II: CSS',
                issued: 'Nov 2024',
                credentialId: '122424031',
                type: 'Course',
                skills: ['Front-end Engineering', 'Front-End Development', 'CSS3'],
                credentialUrl: 'https://www.credential.net/76d71e22-5757-476a-8549-c77d228c50de#acc.ZWLHauxV',
                icon: 'css3-alt',
                brand: true
            },
            {
                name: 'The Origins I: HTML',
                issued: 'Nov 2024',
                credentialId: '122423977',
                type: 'Course',
                skills: ['Front-end Engineering', 'Front-End Development', 'HTML5'],
                credentialUrl: 'https://www.credential.net/4bc61719-d638-4441-aae7-6d163427abc1#acc.EXjLdnHZ',
                icon: 'html5',
                brand: true
            },
        ]
    },
    {
        category: 'Scrimba',
        items: [
            {
                name: 'Learn Tailwind CSS',
                issued: 'Nov 2024',
                type: 'Course',
                skills: ['Responsive Web Design', 'Front-end Engineering', 'Tailwind CSS', 'CSS3'],
                credentialUrl: 'https://scrimba.com/certificate-cert24zAwJ77fGzp2NCmrTsNJcbPNi7brsfEXFpbv',
                icon: 'code'
            },
        ]
    },
];

export const services = [
    { icon: 'code', title: 'Full-Stack Development', text: 'Building scalable web applications with React, Node.js, and ASP.NET Core.' },
    { icon: 'database', title: 'Database Design & Optimization', text: 'Optimized SQL queries and database indexing for superior performance.' },
    { icon: 'shield-alt', title: 'Secure Authentication', text: 'Implementing JWT-based authentication and secure API protection.' },
    { icon: 'brain', title: 'Machine Learning Solutions', text: 'Developing ML models, deep learning solutions, and AI-powered applications using TensorFlow and Python.' },
    { icon: 'chart-line', title: 'Data Analytics', text: 'Comprehensive data analysis, visualization, and insights generation for informed decision-making.' },
    { icon: 'cube', title: 'Neural Networks & Deep Learning', text: 'Building custom neural networks for computer vision, NLP, and predictive analytics.' },
];

export const skills = [
    {
        category: 'Programming Languages',
        items: [
            { icon: 'js', title: 'JavaScript (ES6+)', brand: true },
            { icon: 'js-square', title: 'TypeScript', brand: true },
            { icon: 'python', title: 'Python', brand: true },
            { icon: 'java', title: 'Java', brand: true },
            { icon: 'code', title: 'C' },
            { icon: 'code', title: 'C++' },
            { icon: 'code', title: 'C# / .NET / ASP.NET Core' },
            { icon: 'database', title: 'SQL' },
        ]
    },
    {
        category: 'Frontend Development',
        items: [
            { icon: 'react', title: 'React.js', brand: true },
            { icon: 'react', title: 'Next.js', brand: true },
            { icon: 'html5', title: 'HTML5', brand: true },
            { icon: 'css3-alt', title: 'CSS3', brand: true },
            { icon: 'code', title: 'Tailwind CSS' },
            { icon: 'code', title: 'Bootstrap' },
        ]
    },
    {
        category: 'Backend Development',
        items: [
            { icon: 'node', title: 'Node.js', brand: true },
            { icon: 'code', title: 'Express.js' },
            { icon: 'code', title: 'RESTful APIs' },
            { icon: 'lock', title: 'JWT Authentication' },
        ]
    },
    {
        category: 'Databases',
        items: [
            { icon: 'database', title: 'PostgreSQL' },
            { icon: 'database', title: 'MySQL' },
            { icon: 'leaf', title: 'MongoDB' },
        ]
    },
    {
        category: 'Tools & Cloud',
        items: [
            { icon: 'github', title: 'Git & GitHub', brand: true },
            { icon: 'docker', title: 'Docker', brand: true },
            { icon: 'linux', title: 'Linux', brand: true },
            { icon: 'aws', title: 'AWS', brand: true },
            { icon: 'microsoft', title: 'Microsoft Azure', brand: true },
            { icon: 'rocket', title: 'Vercel & Netlify' },
        ]
    },
    {
        category: 'Machine Learning & AI',
        items: [
            { icon: 'python', title: 'Python (ML/Data Science)', brand: true },
            { icon: 'code', title: 'TensorFlow & Keras' },
            { icon: 'brain', title: 'Deep Learning' },
            { icon: 'chart-line', title: 'Data Analysis & Visualization' },
            { icon: 'cube', title: 'Neural Networks' },
            { icon: 'code', title: 'Natural Language Processing' },
        ]
    },
];

export const education = [
    { icon: 'fa-graduation-cap', period: '2023 – Present', text: 'EHEI Oujda — Computer Engineering (Bac+4)' },
    { icon: 'fa-book', period: '2020 – 2022', text: 'Preparatory Classes — Omar Bn Abdelaziz, Oujda' },
    { icon: 'fa-certificate', period: '2020', text: 'Baccalaureate in Electrical Science & Technology' },
];

export const experience = [
    {
        company: 'AIR BABOUCHE',
        role: 'Full-Stack Engineer',
        period: 'Apr 2025 – May 2025',
        location: 'Oujda, Morocco',
        link: 'https://www.airbabouche.com/',
        summary: 'Developed and deployed a full-stack e-commerce platform using React, Node.js, and REST APIs, increasing user engagement by 30%. Designed and implemented 10+ RESTful API endpoints, reducing response time by 25%. Optimized SQL queries and database indexing, improving overall system performance by 20%. Implemented secure JWT-based authentication, protecting 100% of restricted routes.',
        highlights: [
            'Built full-stack e-commerce platform with React & Node.js',
            'Designed 10+ RESTful API endpoints',
            'Reduced response time by 25%',
            'Improved system performance by 20%',
            'Implemented secure JWT authentication',
        ],
    },
];

export const projects = [
    {
        title: 'AIR BABOUCHE E-Commerce Platform',
        description: 'Full-stack e-commerce platform with secure authentication, product management, and payment integration. Built with React, Node.js, and MySQL.',
        tech: ['React', 'Node.js', 'Express.js', 'MySQL', 'JWT Auth', 'REST APIs'],
        link: 'https://www.airbabouche.com/',
        icon: 'shopping-cart',
        type: 'project',
    },
    {
        title: 'Portfolio Website',
        description: 'Modern single-page portfolio website built with React and Tailwind CSS showcasing projects, skills, and professional experience.',
        tech: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion'],
        link: '#',
        icon: 'briefcase',
        type: 'project',
    },
];

export const testimonials = [
    { quote: 'Yahya delivered exceptional results on our e-commerce platform. His technical expertise and attention to detail were outstanding.', author: 'AIR BABOUCHE Team', stars: 5 },
    { quote: 'Professional, efficient, and dedicated to excellence. A valuable asset to any development team.', author: 'Satisfied Client', stars: 5 },
];

export const contactInfo = {
    email: 'yahyaegz@gmail.com',
    phone: '+212 654495827',
    linkedin: 'https://www.linkedin.com/in/yahya-el-gzouli-99536b331',
    github: 'https://github.com/yahyaegz',
};

export const languages = [
    { language: 'Arabic', level: 'Native' },
    { language: 'English', level: 'Conversational' },
    { language: 'French', level: 'Conversational' },
    { language: 'Spanish', level: 'Basic' },
];
