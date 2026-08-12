# CHAPTER THREE: METHODOLOGY

This chapter presents the methodology adopted for the research. The methodology is organized into three phases: requirement gathering, system design, and testing. Each phase is discussed in detail, including the methods used, justification for their selection, and how they contribute to achieving the research objectives.

## 3.1 Requirements Gathering and Data Collection

The requirements’ gathering process was guided by a simple question: what do families, community elders, and marriage counsellors actually need from a kinship verification system? To answer this, a survey-based approach using structured questionnaires was adopted.

Questionnaires were used as the primary data collection instrument for several practical reasons:

First, it allowed me, the researcher to reach a wider audience across different states. Given that the study focuses on African communities and that family structures differ across culture, states and regions, it was essential to gather input from people in different locations. Questionnaires made this possible without the logistical challenges of conducting interviews across multiple states.

Second, questionnaires offer respondents a sense of anonymity, which can encourage more honest responses, particularly when discussing sensitive topics like family relationships and marriage practices.

Third, questionnaires ensure consistency by providing a structured approach to data collection as every respondent receives the same questions in the same order, which reduces the risk of interviewer bias.

That notwithstanding, questionnaires also have some limitations. Response rates can be low, and there's always the risk that respondents may misunderstand questions without an interviewer present to clarify. With this knowledge at the back of our minds, the questionnaire was designed with a clear and simple language to avoid ambiguity.

### 3.1.1 Questionnaire Design and Distribution
The questionnaire was designed to gather information on certain areas:

1.  Demographic Information: This section collects data such as respondent’s age, gender, location, and role in the community. This information helps in understanding the characteristics of the target user population.

2.  Current Genealogy Practices: This section explores how families currently track lineage and preserve kinship information. This includes the methods used (oral, written records, personal investigation, etc.)

3.  Challenges and Gaps: This section identified challenges and difficulties faced in verifying kinship relationships and assessed awareness of consanguinity issues.

4.  Feature Preferences: This section assessed what features users would want from a digital kinship verification platform

### 3.1.2 Sampling Strategy
A purposive sampling strategy was used to select respondents (Kircher, 2022). Target participants included:

- Family elders and community leaders

- Marriage counsellors and religious leaders

- Young adults preparing for marriage

- Members of communities with strong oral genealogy traditions

### 3.1.3 Requirement Analysis
The data collected from questionnaires was analysed using descriptive statistics to identify patterns and trends in how communities currently manage genealogical information and what they need from a verification system (Colwill et al., 2024). The findings from this phase directly informed the system requirements, which is used to guide the design phase.

The analysis was from a diverse group of stakeholders involved in marriage and kinship verification. The demographic breakdown is as follows:

- *Gender*: Predominantly Female (59.4%) and Male (37.5%), with a small percentage (3.1%) preferring not to say.

- *Age Distribution*: The majority were between 41-60 years (50%), followed by youth under 30 years (28.1%). This provides a generational balance between traditional knowledge holders and future technology users.

- *Community roles*: The highest representation came from “Religious Leaders” (21.9%), "Marriage Counsellors" (12.5%), and "Community Elders" (6.3%). Notably, 40.6% identified as "Other," specifying roles such as Teachers, Health Educators, and general community members, ensuring a broad societal perspective.

- *Experience*: 40.6% of respondents have less than 5 years in their current role, while 28.1% have over 20 years, offering a mix of fresh and long-standing community insight.

> The responses gotten from the questionnaire validates a critical need for the platform. While 91.9% of respondents affirmed that their communities have established procedures for verifying family relationships such as through family elders’ knowledge, oral history, clan records, religious records or personal investigation, 97.4% rated the problem of unknowingly marrying a relative as “Very Serious” or “Serious”, and 18.5% have encountered cases where people discovered they were related after marriage.
>
> Respondents Agreed/Strongly Agreed to the following challenges, confirming the platform's necessity:

- Younger generations know little about their ancestry: 92.1% Agreed/Strongly Agreed.

- Oral history is becoming unreliable: 65.6% Agreed/Strongly Agreed.

- Existing verification methods are time-consuming: 60.5% Agreed/Strongly Agreed.

- There is a need for a digital solution: 76.3% Agreed/Strongly Agreed.

Using the 70% threshold (respondents rating a feature 4 or 5 on a 5-point scale), the specific features were identified as mandatory:

| Feature                                  | % of Respondents Rating 4 or 5 | Priority Level |
|------------------------------------------|--------------------------------|----------------|
| Ancestry Tracing                         | 94.7%                          | Critical       |
| Clan Identification                      | 94.7%                          | Critical       |
| Marriage Eligibility Verification        | 91.8%                          | Critical       |
| Family Tree Creation                     | 86.3%                          | Critical       |
| Visual Family Tree Display               | 75.6%                          | Critical       |
| Search for Relatives                     | 97.2%                          | Critical       |
| Secure User Authentication               | 78.3%                          | Critical       |
| Relationship Detection (Two Individuals) | 83.7%                          | Critical       |
| Family History Documentation             | 94.6%                          | Critical       |

Support for the platform was overwhelmingly positive. **83.7%** stated they would support the adoption of the platform, **87.5%** agreed that such a platform could reduce cases of consanguineous marriages and **94.6%** believed it would help preserve family history.

Open-ended responses regarding challenges, data requirements, and concerns were analysed thematically. Four major themes emerged:

Theme 1: Accessibility and Geographic Barriers

- Frequency: Mentioned by 13 respondents (40.6%).

- Evidence: *"Distance barriers,"* *"The two parties not being open because of fear of losing their partner,"* *"It may be difficult to get in touch with the people that will give the needed information in real-time."*

- Implication: The system must be location-independent and accessible remotely.

Theme 2: Data Credibility, Privacy, and Security

- Frequency: Mentioned by 10 respondents (31.3%).

- Evidence: *"The accuracy of the findings,"* *"Fake information,"* *"Vulnerability to hacking,"* *"Information can be used against an individual by people of ill motive."*

- Implication: The system must include robust data validation, source verification, role-based access control, and data encryption.

Theme 3: Usability and Technological Literacy

- Frequency: Mentioned by 8 respondents (25.0%).

- Evidence: *"Traditional people don't have the time and knowledge to use it,"* *"Older people who are not tech smart may have difficulties,"* *"Nigeria is still emerging... Network is a big challenge."*

- Implication: The system must feature a highly intuitive UI, offline capabilities, and a simple onboarding process for users with low technological literacy.

Theme 4: Data Completeness and Hierarchical Structure

- Frequency: Mentioned by 16 respondents (50.0%).

- Evidence: *"Family tree, names of kindred,"* *"State to Local Government to Town to Village,"* *"Family rules and regulations,"* *"Ancestry relationships, Inter-Clan relationships."*

- Implication: The data model must support hierarchical kinship structures (State → Local Government → Clan → Kindred → Family) and link individuals to their complete ancestral roots.

### 3.1.4 Software Requirement Specification
Based on the quantitative and qualitative analyses presented above, a formal Software Requirements Specification document was developed. The SRS translates the user needs into structured, testable requirements categorized as follows:

a\) Functional Requirements (FR):  
These define specific system behaviours and features that the platform must perform.

- User registration and profile management.

- Family tree creation and visualization.

- Ancestry tracing by hierarchical location (State → LGA → Town → Clan → Kindred).

- Relationship detection between two individuals.

- Marriage eligibility verification.

- Search functionality for relatives.

b\) Non-Functional Requirements (NFR):  
These define quality attributes and system constraints.

- Security (NF-S): Role-Based Access Control, data encryption, multi-factor authentication, and audit trails.

- Usability (NF-U): Intuitive user interface, guided tour and tooltips.

- Performance (NF-P): Page load times under 3 seconds, support for up to 10,000 concurrent users, and offline capabilities.

- Reliability (NF-R): 99.5% uptime, automatic data backup, and conflict resolution mechanisms for disputed records.

- Maintainability (NF-M): Modular code architecture and comprehensive system documentation.

## 3.2 System Design Methodology

The Object-Oriented Analysis and Design Methodology (OOADM) was adopted. This is a software engineering approach that models a system as a group of interacting objects, where each object represents some entity of interest in the system being modelled.

The OOADM was selected for several reasons:

**Modelling Complex Relationships**: OOADM is particularly well-suited for systems like kinship verification, where the real-world domain involves complex, interconnected entities such as people, families, relationships, and marriages. In African communities, family relationships often include intermarriage, polygamy, and extended kinship networks that do not fit neatly into simple tree structures. The object-oriented approach can represent these relationships more naturally.

**Reusability**: OOADM emphasizes reusability through inheritance and encapsulation. This means that common elements of the kinship verification system can be designed once and reused across different modules, reducing development time and ensuring consistency.

**Incremental and Iterative Development**: OOADM supports iterative development where the system is refined through successive cycles. This is particularly valuable for the kinship verification platform, as requirements may evolve as users provide feedback and as new kinship scenarios emerge.

**Smooth Transition from Analysis to Design**: OOADM emphasizes a smooth evolution from analysis models to design models. The objects identified during the analysis phase bear a close resemblance to those in the design phase, making the transition more manageable and ensuring that design decisions reflect user requirements.

The OOAD approach is implemented using the *Unified Modelling Language (UML)*, which provides a standardized set of visual modelling tools. The specific UML diagrams selected for this project, along with their justifications, are detailed below.

### Use Case Diagram

The Use Case Diagram provides a high-level overview of the system's functionality from the perspective of its external actors.

![Use Case Diagram for the Kinship Verification Platform](media/use-case-diagram.png)

The diagram above identifies two primary actors that interact with the system:

1.  **Community Member:** This is the primary user of the system. Any individual within the community can register as a Community Member. This role is responsible for viewing family trees, tracing ancestry, detecting relationships, verifying marriage eligibility, searching for relatives, and submitting or endorsing family records.

2.  **System Administrator:** This role oversees the platform's integrity and security. The Administrator manages user accounts, reviews disputed records, resolves escalated disputes, and monitors system activity via audit logs.

The Use Case Diagram was selected as the first design artifact because it serves as an excellent communication tool between the developer and non-technical stakeholders. It clearly defines the system boundary, that is, what the system will do and what it will not do while also distinguishing between different user roles and their permissions.

### Sequence Diagram

The sequence diagram shows the flow of communication between the objects in the system. The diagram below shows the sequence diagram for the 'Check Marriage Eligibility' use case. The diagram illustrates the chronological interaction between the Community Member, the System, the RelationshipEngine, and the Database. The Community Member initiates the process by entering two individuals (Step 1), after which the System retrieves their respective family trees from the Database (Steps 3–6) and delegates kinship calculation to the RelationshipEngine (Step 7). The RelationshipEngine compares the family trees to identify common ancestors (Step 8) and returns the kinship result (Step 9), enabling the System to generate and return a Marriage Eligibility Report to the user (Steps 10–11). This sequence diagram was selected because it visualizes the complex logic underlying the platform's core functionality—marriage eligibility verification—ensuring that developers clearly understand the required flow and that stakeholders can trace the logic back to the requirements derived from the questionnaire.

![Sequence Diagram for the Check Marriage Eligibility use case](media/sequence-diagram.png)

## 3.3 Testing and Evaluation Methodology

This section presents the approach used to verify and validate that the Kinship Verification Platform meets its specified requirements and functions correctly. The testing methodology follows a requirements-based testing approach, ensuring that every functional and non-functional requirement is traceable to specific test cases.

### 3.3.1 Requirements-Based Testing
Requirements-based testing is a well-established approach in software engineering. It ensures that all functional and non-functional requirements are verified, and it provides traceability between requirements and test cases which is especially important for systems like this one that have real-world implications.

This involves:

**Mapping Requirements to Tests**: Each functional requirement is mapped to one or more specific test cases. This ensures complete traceability from user needs to system verification.

For example:

- **FR-01 (User Registration)** maps to two test cases: one for successful registration and one for handling duplicate email errors.

- **FR-02 (Secure User Login)** maps to test cases for valid credentials, invalid credentials, and password reset.

- **FR-08 (Relationship Detection)** maps to test cases for cousins, distant relatives, and unrelated individuals.

**Test Case Design**: Test cases are designed based on the functional and non-functional requirements. Each test case follows a structured format that includes: a unique ID, the SRS requirement being tested, a brief description, preconditions, step-by-step instructions, test data, expected results, and a status field for pass/fail recording.

**Test Execution**: Tests are executed by the development team and potential users. For each function, the system is tested with both expected and unexpected input to verify correct handling.

Tests will be executed in three phases:

Phase 1: Developer Testing (Unit and Integration Testing)

- *Who*: The developer(s).

- *What*: Individual functions and modules are tested.

- *How*:

  - Unit Testing: Core functions will be tested using a testing framework (e.g., PHPUnit, Jest, or pytest, depending on the technology stack).

  - Integration Testing: API endpoints will be tested using Postman to verify that the frontend, backend, and database interact correctly.

- *Pass/Fail Criteria*: All unit and integration tests must pass before proceeding to system testing.

Phase 2: System Testing

- *Who*: The developer and/or a designated tester.

- *What*: The complete, integrated system is tested against all functional and non-functional requirements.

- *How*: The test cases are executed manually. Each test case is performed, and the actual result is recorded against the expected result.

- *Pass/Fail Criteria*: A system test passes if the actual result matches the expected result. Any failed test is logged in a bug tracking system and assigned to the developer for fixing.

Phase 3: User Acceptance Testing (UAT)

- *Who*: 5-10 target users, including community members, religious leaders, and youth.

- *What*: Real users perform predefined tasks on the system and provide feedback.

- *How*:

  - Participants are briefed on the system's purpose.

  - Each participant is given a set of tasks to complete.

  - An observer notes any difficulties encountered.

  - After completing the tasks, participants complete a feedback questionnaire.

- *Pass/Fail Criteria*: The system passes UAT if:

- All participants successfully complete all tasks (with minimal assistance).

- The average usability rating is 4.0 or higher (out of 5).

- Any critical issues identified are resolved before final deployment.

> Each User participating in the user acceptance test will perform the core functionalities and explore the application, after which they will be given a questionnaire to complete. This will ask questions on how their experience while using the platform was.

### 3.3.2 Evaluation Criteria
The system is considered successful if it meets the following criteria (Seymour et al., 2026):

- All functional requirements met – The system performs all specified functions

- Accurate kinship verification – Relationship paths are correctly calculated

- User acceptance – Target users can navigate and use the system effectively

- System stability – The system runs without crashes or errors

### 3.3.3 Success Criteria
Following the Information Systems Success Model discussed in Chapter 2 (section 2.2.3), the platform's success is evaluated across three dimensions:

1.  System Quality – Does the platform perform well technically?

2.  Information Quality – Is the genealogical data accurate and complete?

3.  User Satisfaction – Do users find the platform useful and trustworthy?
