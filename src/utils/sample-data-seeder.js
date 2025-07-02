const firebaseDB = require('./firebase-db');

// Sample session data to seed into user's account
const sampleSessions = [
  {
    title: 'Machine Learning Fundamentals',
    type: 'lecture',
    date: '2024-01-15',
    duration: '01:23:45',
    description: 'Introduction to supervised and unsupervised learning algorithms.',
    transcript: [
      {
        timestamp: '00:00:15',
        text: 'Welcome to today\'s lecture on machine learning fundamentals. We\'ll be covering the basics of supervised and unsupervised learning algorithms.'
      },
      {
        timestamp: '00:02:30',
        text: 'Supervised learning is a type of machine learning where we train models using labeled data. The algorithm learns from input-output pairs.'
      },
      {
        timestamp: '00:05:45',
        text: 'Common supervised learning algorithms include linear regression, decision trees, and neural networks. Each has its own strengths and use cases.'
      }
    ],
    summary: 'This lecture provided an introduction to machine learning fundamentals, focusing on supervised and unsupervised learning approaches.',
    keyPoints: [
      'Supervised learning uses labeled training data',
      'Unsupervised learning finds patterns in unlabeled data',
      'Common algorithms include regression, classification, and clustering'
    ],
    actionItems: [
      'Practice implementing linear regression',
      'Read chapter 3 of the textbook',
      'Complete homework assignment on decision trees'
    ],
    flashcards: [
      {
        question: 'What is supervised learning?',
        answer: 'Supervised learning is a type of machine learning where models are trained using labeled data with input-output pairs.'
      },
      {
        question: 'Name three common supervised learning algorithms.',
        answer: 'Linear regression, decision trees, and neural networks are common supervised learning algorithms.'
      }
    ],
    notes: [],
    screenshots: [
      { id: 1, timestamp: '00:03:15', description: 'Supervised Learning Diagram' },
      { id: 2, timestamp: '00:07:22', description: 'Algorithm Comparison Chart' }
    ]
  },
  {
    title: 'Weekly Team Standup',
    type: 'zoom',
    date: '2024-01-14',
    duration: '00:32:15',
    description: 'Sprint planning and progress updates discussion.',
    transcript: [
      {
        timestamp: '00:00:10',
        text: 'Good morning everyone, welcome to our weekly standup. Let\'s start with sprint updates.'
      },
      {
        timestamp: '00:01:30',
        text: 'Sarah, can you give us an update on the authentication feature development?'
      },
      {
        timestamp: '00:02:45',
        text: 'The authentication system is 80% complete. I\'m working on the password reset functionality.'
      }
    ],
    summary: 'Weekly standup covering sprint progress, authentication feature updates, and API integration status.',
    keyPoints: [
      'Authentication system 80% complete',
      'Password reset functionality in progress',
      'API integrations on track'
    ],
    actionItems: [
      'Complete authentication testing by Friday',
      'Review API documentation',
      'Schedule code review for next Tuesday'
    ],
    flashcards: [
      {
        question: 'What is the current status of the authentication system?',
        answer: 'The authentication system is 80% complete with password reset functionality in progress.'
      }
    ],
    notes: [],
    screenshots: [
      { id: 1, timestamp: '00:02:15', description: 'Sprint Board Overview' },
      { id: 2, timestamp: '00:05:30', description: 'Authentication Flow Diagram' }
    ]
  },
  {
    title: 'Python Tutorial Series',
    type: 'youtube',
    date: '2024-01-13',
    duration: '02:15:30',
    description: 'Complete Python programming tutorial for beginners.',
    transcript: [
      {
        timestamp: '00:00:20',
        text: 'Welcome to this comprehensive Python tutorial series for beginners. Today we\'ll cover variables and data types.'
      },
      {
        timestamp: '00:03:45',
        text: 'Python has several built-in data types including integers, floats, strings, and booleans.'
      },
      {
        timestamp: '00:07:15',
        text: 'Let\'s create our first variable. In Python, you can assign a value like this: name equals quote John quote.'
      }
    ],
    summary: 'Comprehensive Python tutorial covering variables, data types, and basic programming concepts for beginners.',
    keyPoints: [
      'Python variables don\'t need type declarations',
      'Built-in data types: int, float, string, boolean',
      'Lists are ordered and mutable collections'
    ],
    actionItems: [
      'Practice creating variables with different data types',
      'Complete the exercises in chapter 2',
      'Install Python development environment'
    ],
    flashcards: [
      {
        question: 'What are the main built-in data types in Python?',
        answer: 'Integers, floats, strings, and booleans are the main built-in data types in Python.'
      },
      {
        question: 'How do you create a variable in Python?',
        answer: 'In Python, you create a variable by assigning a value: name = "John"'
      }
    ],
    notes: [],
    screenshots: [
      { id: 1, timestamp: '00:05:20', description: 'Variable Assignment Example' },
      { id: 2, timestamp: '00:08:45', description: 'Data Types Overview' }
    ]
  },
  {
    title: 'Introduction to Data Science',
    type: 'lecture',
    date: '2024-01-16',
    duration: '00:36:15',
    description: 'Comprehensive overview of data science fundamentals, CRISP-DM methodology, and essential skills.',
    transcript: [
      {
        timestamp: '00:00:30',
        text: 'Welcome everyone to today\'s comprehensive lecture on Introduction to Data Science. I\'m Dr. Sarah Mitchell, and I\'ve been working in data science for over fifteen years across both academia and industry.'
      },
      {
        timestamp: '00:01:15',
        text: 'Data science is a multidisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from structured and unstructured data. It combines statistics, mathematics, computer science, and domain expertise.'
      },
      {
        timestamp: '00:02:30',
        text: 'Think of data science as modern-day alchemy - but instead of trying to turn lead into gold, we\'re transforming raw, messy data into valuable, actionable insights that drive business decisions and scientific discoveries.'
      },
      {
        timestamp: '00:03:45',
        text: 'The field emerged from the intersection of several disciplines. Statistics provides the mathematical foundation for understanding uncertainty and variability in data. Computer science gives us the tools and algorithms to process large datasets efficiently.'
      },
      {
        timestamp: '00:05:00',
        text: 'Domain expertise is crucial because data without context is just noise. You need to understand the business problem, the industry constraints, and the real-world implications of your findings.'
      },
      {
        timestamp: '00:06:15',
        text: 'Let\'s talk about the data science workflow. We follow what\'s called CRISP-DM: Cross-Industry Standard Process for Data Mining. It consists of six interconnected phases that guide our approach to any data science project.'
      },
      {
        timestamp: '00:07:30',
        text: 'Phase one is Business Understanding. This is where we define the problem clearly. What exactly are we trying to solve? What would success look like? What are the constraints and requirements? This phase is critical because a well-defined problem is half solved.'
      },
      {
        timestamp: '00:08:45',
        text: 'Phase two is Data Understanding. We explore what data is available, assess its quality, and identify any gaps or limitations. This includes understanding the data sources, the collection methods, and potential biases in the data.'
      },
      {
        timestamp: '00:10:00',
        text: 'Phase three, Data Preparation, typically consumes 60 to 80 percent of a data scientist\'s time. This involves cleaning the data, handling missing values, transforming variables, and creating new features that might be useful for analysis.'
      },
      {
        timestamp: '00:11:15',
        text: 'Data cleaning is both an art and a science. You need to decide how to handle outliers - are they errors or genuine extreme values? Missing data requires careful consideration: should you impute values, remove records, or use algorithms that handle missing data naturally?'
      },
      {
        timestamp: '00:12:30',
        text: 'Phase four is Modeling, where we apply statistical and machine learning algorithms to the prepared data. This might involve supervised learning for prediction tasks, unsupervised learning for pattern discovery, or reinforcement learning for optimization problems.'
      },
      {
        timestamp: '00:13:45',
        text: 'The choice of algorithm depends on your problem type, data characteristics, and business constraints. Linear regression for simple relationships, random forests for robust predictions, neural networks for complex patterns, or clustering algorithms for segmentation.'
      },
      {
        timestamp: '00:15:00',
        text: 'Phase five is Evaluation. We assess how well our model performs using appropriate metrics. For classification, we might use accuracy, precision, recall, or F1-score. For regression, we look at mean squared error, R-squared, or mean absolute error.'
      },
      {
        timestamp: '00:16:15',
        text: 'But evaluation goes beyond just statistical metrics. We need to consider business impact, computational efficiency, model interpretability, and potential ethical implications. A slightly less accurate model that\'s interpretable might be preferable in regulated industries.'
      },
      {
        timestamp: '00:17:30',
        text: 'The final phase is Deployment. This is where many academic projects differ from industry applications. In the real world, you need to integrate your model into existing systems, monitor its performance over time, and update it as new data becomes available.'
      },
      {
        timestamp: '00:18:45',
        text: 'Let\'s discuss the essential skills for data scientists. Programming is fundamental - Python and R are the most popular languages. Python offers extensive libraries like pandas for data manipulation, NumPy for numerical computing, and scikit-learn for machine learning.'
      },
      {
        timestamp: '00:20:00',
        text: 'R excels in statistical analysis and visualization. It has packages like dplyr for data manipulation, ggplot2 for beautiful visualizations, and specialized packages for specific statistical techniques. The choice between Python and R often depends on your organization and specific use case.'
      },
      {
        timestamp: '00:21:15',
        text: 'Statistics and probability theory form the mathematical foundation. You need to understand distributions, hypothesis testing, confidence intervals, and experimental design. Without this foundation, you might misinterpret results or draw incorrect conclusions.'
      },
      {
        timestamp: '00:22:30',
        text: 'Machine learning knowledge is essential, but it\'s important to understand not just how algorithms work, but when to use them. Overfitting is a common pitfall - your model performs well on training data but fails on new data. Cross-validation and proper train-test splits help address this.'
      },
      {
        timestamp: '00:23:45',
        text: 'Data visualization is crucial for both exploration and communication. Tools like Tableau, Power BI, or programming libraries like matplotlib and D3.js help you create compelling visual stories from your data. Good visualizations can reveal patterns that aren\'t apparent in raw numbers.'
      },
      {
        timestamp: '00:25:00',
        text: 'Communication skills are often undervalued but absolutely critical. You need to translate technical findings into actionable insights for non-technical stakeholders. This means avoiding jargon, focusing on business impact, and using clear, compelling visualizations.'
      },
      {
        timestamp: '00:26:15',
        text: 'Real-world applications of data science span virtually every industry. In healthcare, we\'re using machine learning to analyze medical images, predict patient outcomes, and personalize treatment plans. The potential to save lives through data-driven insights is enormous.'
      },
      {
        timestamp: '00:27:30',
        text: 'In finance, algorithms detect fraudulent transactions in real-time, assess credit risk, and enable algorithmic trading. Netflix uses recommendation systems to suggest content, Amazon optimizes its supply chain, and Google\'s search algorithms process billions of queries daily.'
      },
      {
        timestamp: '00:28:45',
        text: 'The career paths in data science are diverse. Data analysts focus on descriptive analytics and reporting. Data scientists build predictive models and conduct advanced analytics. Machine learning engineers specialize in deploying and maintaining ML systems at scale.'
      },
      {
        timestamp: '00:30:00',
        text: 'Data engineers build the infrastructure that makes data science possible - data pipelines, warehouses, and processing systems. Product data scientists work closely with product teams to inform feature development and user experience improvements.'
      },
      {
        timestamp: '00:31:15',
        text: 'For those starting their data science journey, I recommend beginning with Python or R basics, then diving into pandas and numpy for data manipulation. Work on real projects using datasets from Kaggle or government open data portals.'
      },
      {
        timestamp: '00:32:30',
        text: 'Build a portfolio that showcases your skills through end-to-end projects. Document your work clearly, explain your thought process, and include both successes and challenges you encountered. Employers want to see how you think through problems, not just your final results.'
      },
      {
        timestamp: '00:33:45',
        text: 'Stay curious and keep learning. The field evolves rapidly with new techniques, tools, and applications emerging constantly. Follow data science blogs, attend conferences or meetups, and participate in online communities like Stack Overflow and Reddit\'s data science forums.'
      },
      {
        timestamp: '00:35:00',
        text: 'Finally, remember that data science is ultimately about solving real-world problems and creating value. The most sophisticated algorithm in the world is useless if it doesn\'t address a genuine business need or societal challenge. Focus on impact, not just technical complexity.'
      },
      {
        timestamp: '00:36:15',
        text: 'That concludes our introduction to data science. Remember, this is a field where continuous learning is not just encouraged but essential. The intersection of technology, statistics, and domain expertise offers endless opportunities for innovation and discovery.'
      }
    ],
    summary: 'Comprehensive 36-minute lecture covering data science fundamentals, detailed CRISP-DM methodology explanation, essential technical and soft skills, extensive real-world applications across industries, diverse career paths, and practical guidance for aspiring data scientists including portfolio development and continuous learning strategies.',
    keyPoints: [
      'Data science combines statistics, computer science, and domain expertise to solve real problems',
      'CRISP-DM methodology: Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment',
      'Data preparation typically consumes 60-80% of a data scientist\'s time in real projects',
      'Programming skills: Python (pandas, NumPy, scikit-learn) and R (dplyr, ggplot2) are essential',
      'Statistical foundation required: distributions, hypothesis testing, experimental design, cross-validation',
      'Communication skills critical for translating technical findings to business stakeholders',
      'Real-world applications span healthcare, finance, technology, and virtually every industry',
      'Career paths include data analyst, data scientist, ML engineer, data engineer, and product data scientist',
      'Portfolio development should showcase end-to-end projects with clear documentation',
      'Continuous learning essential due to rapidly evolving field and emerging technologies'
    ],
    actionItems: [
      'Start with Python or R basics, then progress to data manipulation libraries (pandas, dplyr)',
      'Build strong statistics foundation including probability, hypothesis testing, and experimental design',
      'Practice with real datasets from Kaggle or government open data portals',
      'Develop end-to-end projects for your portfolio with clear documentation and thought process',
      'Learn data visualization tools (matplotlib, ggplot2, Tableau) for exploration and communication',
      'Master machine learning concepts including overfitting, cross-validation, and algorithm selection',
      'Understand the complete CRISP-DM workflow from business understanding to deployment',
      'Develop communication skills to present findings to non-technical stakeholders',
      'Stay current with field developments through blogs, conferences, and online communities',
      'Focus on creating business value and solving real-world problems, not just technical complexity'
    ],
    flashcards: [
      {
        question: 'What is data science and what disciplines does it combine?',
        answer: 'Data science is a multidisciplinary field that uses scientific methods, processes, algorithms, and systems to extract knowledge and insights from data. It combines statistics, mathematics, computer science, and domain expertise.'
      },
      {
        question: 'What does CRISP-DM stand for and what are its six phases?',
        answer: 'CRISP-DM stands for Cross-Industry Standard Process for Data Mining. The six phases are: Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, and Deployment.'
      },
      {
        question: 'What percentage of time does data preparation typically consume in real projects?',
        answer: 'Data preparation typically consumes 60 to 80 percent of a data scientist\'s time in real projects.'
      },
      {
        question: 'What are the most popular programming languages for data science and their key libraries?',
        answer: 'Python (with pandas, NumPy, scikit-learn) and R (with dplyr, ggplot2) are the most popular. Python excels in machine learning, while R excels in statistical analysis and visualization.'
      },
      {
        question: 'What is overfitting and how can it be addressed?',
        answer: 'Overfitting occurs when a model performs well on training data but fails on new data. It can be addressed through cross-validation and proper train-test splits.'
      },
      {
        question: 'Why are communication skills critical for data scientists?',
        answer: 'Communication skills are critical because data scientists need to translate technical findings into actionable insights for non-technical stakeholders, avoiding jargon and focusing on business impact.'
      },
      {
        question: 'What should be included in a data science portfolio?',
        answer: 'A portfolio should showcase end-to-end projects with clear documentation, explain your thought process, and include both successes and challenges encountered.'
      },
      {
        question: 'What are the different career paths in data science?',
        answer: 'Career paths include data analysts (descriptive analytics), data scientists (predictive models), machine learning engineers (ML systems at scale), data engineers (infrastructure), and product data scientists (feature development).'
      }
    ],
    notes: [],
    screenshots: [
      { id: 1, timestamp: '00:02:30', description: 'Data Science Definition and Core Components' },
      { id: 2, timestamp: '00:05:45', description: 'CRISP-DM Methodology Framework' }
    ]
  }
];

class SampleDataSeeder {
  async seedUserData(userId) {
    console.log(`🌱 Starting to seed sample data for user: ${userId}`);
    let seededCount = 0;
    
    try {
      for (let i = 0; i < sampleSessions.length; i++) {
        const session = sampleSessions[i];
        console.log(`📝 Seeding session ${i + 1}/${sampleSessions.length}: ${session.title}`);
        
        const result = await firebaseDB.saveSession(userId, session);
        
        if (result.success) {
          seededCount++;
          console.log(`✅ Successfully seeded: ${session.title}`);
        } else {
          console.error(`❌ Failed to seed: ${session.title} - ${result.error}`);
        }
        
        // Small delay between inserts to avoid overwhelming Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`🎉 Sample data seeding complete! Added ${seededCount}/${sampleSessions.length} sessions.`);
      return { success: true, seededCount, totalSessions: sampleSessions.length };
      
    } catch (error) {
      console.error('🚨 Error during sample data seeding:', error);
      return { success: false, error: error.message, seededCount };
    }
  }

  getSampleSessionsCount() {
    return sampleSessions.length;
  }

  getSampleSessionTitles() {
    return sampleSessions.map(session => session.title);
  }
}

module.exports = new SampleDataSeeder();
