%------------------------
% Resume Template - Modified for Adarsh Kumar
%------------------------
\documentclass[a4paper,20pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage[pdftex]{hyperref}
\usepackage{fancyhdr}
\usepackage{enumitem}

% bullet alignment fix
\setlist[itemize]{leftmargin=12pt}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins – moved content higher
\addtolength{\oddsidemargin}{-0.530in}
\addtolength{\evensidemargin}{-0.375in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.62in}
\addtolength{\textheight}{1.2in}

\urlstyle{rm}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Section titles
\titleformat{\section}{
  \vspace{-6pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-4pt}]

% Custom bullet style
\renewcommand{\labelitemi}{\small$\bullet$}

\begin{document}

%----------HEADER----------
\begin{center}
    \vspace{-18pt}
    {\LARGE \textbf{Adarsh Kumar}} \\[4pt]
    \small
    \href{mailto:adarsh99733207@gmail.com}{adarsh99733207@gmail.com} \ $|$ \ 
    \href{https://www.linkedin.com/in/adarsh-kumar62041/}{linkedin.com/in/adarsh-kumar62041} \ $|$ \ 
    \href{https://github.com/Adshkumar}{github.com/Adshkumar} \ $|$ \ 
    \href{https://adsingh-portfolio.vercel.app/home}{adsingh-portfolio.vercel.app}
    \vspace{2pt}
\end{center}

%-----------OBJECTIVE-----------------
\section{Objective}
\vspace{-2pt}
\normalsize
Motivated and enthusiastic web developer with hands-on experience in building web applications using \textbf{React}, \textbf{Tailwind}, \textbf{JavaScript}, \textbf{Node.js}, and \textbf{MongoDB}. Eager to apply my skills in frontend and backend development, contribute to real-world projects, and grow as a full-stack developer in a professional environment.

\vspace{-2pt}

%-----------TECHNICAL SKILLS -----------------
\section{Technical Skills}
\vspace{3pt}
\textbf{Languages:} C++, JavaScript
\vspace{3pt}
\\
\textbf{Frontend:} JavaScript, React, Tailwind CSS, HTML5 \& CSS3 \\[3pt]
\textbf{Backend:} Node.js, Express.js, REST API, JWT Authentication \\[3pt]
\textbf{Databases:} MongoDB (Mongoose) \\[3pt]
\textbf{Tools:} GitHub, VS Code, Socket.IO \\[3pt]
\textbf{Others:} Problem Solving, Basic Data Structures \& Algorithms (learning in C++)

\vspace{-4pt}

%-----------EDUCATION-----------------
\section{Education}
\vspace{3pt}
\textbf{Chhotu Ram Rural Institute of Technology} \hfill New Delhi, Delhi \\
Diploma in Computer Science \hfill 2024--Present \\[5pt]
\textbf{Kids Camp International School} \hfill Muzaffarpur, Bihar \\
Class X (CBSE) — 78\% \hfill 2024

\vspace{-3pt}

%-----------EXPERIENCE -----------------
\section{Experience}
\vspace{3pt}
\textbf{AKM TECHIE (Intern)} \hfill June 2025 -- July 2025 \\
Frontend Web Development Intern — DTEST Project (HTML, CSS, JavaScript)

\begin{itemize}[topsep=2pt, itemsep=0pt, parsep=2pt]
    \item \textbf{Developed} a multi-page responsive website with modern UI components including admin dashboard, client portal, and service page.
    \item \textbf{Created} custom CSS styling for all sections ensuring visual consistency and responsive design across devices.
    \item \textbf{Implemented} interactive user interfaces for contact forms, service demonstrations, and business statistics display.
\end{itemize}

\vspace{-4pt}

%-----------PROJECTS-----------------
\section{Projects}
\vspace{3pt}

\textbf{AI Interview Preparation Platform} | Node.js, Express.js, MongoDB, React.js, JWT, REST API

\begin{itemize}[topsep=2pt, itemsep=0pt, parsep=2pt]
\item Engineered a \textbf{full-stack AI-powered interview preparation platform} enabling resume uploads and automated interview report generation from job descriptions. Built a \textbf{modular MVC backend architecture} (controllers, routes, models, middleware, services) for scalability.

\item Integrated \textbf{JWT authentication with protected routes} to ensure secure user sessions and API access, and leveraged \textbf{AI services} for resume analysis and intelligent interview report generation.
\end{itemize}

\vspace{4pt}

\textbf{Uber-Backend} | Node.js, Express.js, MongoDB

\begin{itemize}[topsep=2pt, itemsep=0pt, parsep=2pt]
    \item Built a \textbf{comprehensive backend system} simulating Uber's core functionality including user authentication, ride booking, and driver management.
    \item Secured endpoints using \textbf{JWT authentication middleware} and managed data persistence with MongoDB for efficient storage of user, driver, and ride information.
    \item Incorporated \textbf{Socket.IO} for real-time communication between drivers and passengers during active rides.
    \item Structured MongoDB schemas for efficient data storage.
\end{itemize}

\vspace{4pt}

\textbf{Chat Application} | Node.js, Express.js, MongoDB, React.js, Socket.IO, JWT Authentication, Tailwind CSS, REST API

\begin{itemize}[topsep=2pt, itemsep=0pt, parsep=2pt]
    \item Architected a structured \textbf{MVC-based backend} with clear separation of controllers, routes, models, and middleware.
    \item Created RESTful APIs for user authentication, chat management, and message handling, ensuring clean data flow between frontend and backend.
    \item Established \textbf{JWT-based authentication and authorization}, securing protected routes and user sessions.
    % \item Formulated MongoDB schemas using Mongoose for users, chats, messages, and token management.
    \item Enabled real-time communication using \textbf{Socket.IO} for instant message delivery, typing indicators, and online status updates.
    \item Implemented \textbf{API rate limiting middleware} to control request frequency, prevent abuse, and improve backend security and stability.
\end{itemize}

\vspace{-6pt}

%-----------ACHIEVEMENTS---------
\enlargethispage{3\baselineskip}
\raggedbottom
\section{Achievements}
\vspace{2pt}
\textbf{LeetCode Badge:} Earned problem-solving badge on LeetCode for consistent performance and coding proficiency. \\[3pt]
\textbf{Internship Certificate:} Successfully completed internship with hands-on project experience.

\end{document}







I want to build an app close to CalAI. It should allow my user to signup/signin, and track their calories through a day.
They will do this taking a photo of all the meals they're having through a day, and its our job to extract key feature like "protein intake" , "calories intake" so on to the best of our abilities from the picture. THE USER WILL NOT MANUALLY PUT THESE VALUES, WE HAVE TO USE SOME SORT OF AN IMAGE MODEL TO EXTRACT THESE.

Another important part of this app are the analytics. User should be able to track their intake over time . We need graphs, monthly, Weekly charts, but most importanlty people should see their daily intake on the first screen.

Try to use the color Scheme like the one posted in the screenshot. I've attached refrenches from CALAI so you know what to build.

TECH STACK - user some react for mobile app . user mongo db and node.js/express as a primary tech stack for the backend.