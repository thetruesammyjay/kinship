# CHAPTER ONE: INTRODUCTION

## 1.1 Background to the Study

Genealogy and kinship verification have always been more than just family trees in African societies; they’ve been the very foundation of how communities organise themselves. Across many communities, family lineage wasn’t simply recorded, it was lived. It was passed down through oral traditions by historians and elders in the community. For a very long time, African communities have relied on oral genealogies passed down from generation to generation by designated tribal historians and elders in the community. This ensures that cultural identity didn’t fade and that social structures remained intact (Bush & Lynch, 2019). These oral traditions served as both historical records and living documents that governed social relationships, marriage eligibility and communal identity.

Genealogy is more than just knowing your family history, it has real-life effects, especially when it comes to marriage. For generations, knowledge of familial relationships has guided marriage eligibility choices. This practice has prevented unions between individuals with close blood ties. In doing so, it has preserved the genetic health and social harmony of communities. The continuity of consanguineous marriages, that is, marriages between individuals who are related either as second cousins or closer, remain surprisingly common worldwide. Estimates indicate that more than 1.2 billion people around the world practice consanguineous marriages (Fareed & Afzal, 2017). In Africa, the consanguinity rates vary considerably. In Egypt, for instance, a prevalence of 35.9% among women who had entered marriages (Hussein et al., 2022), and a Moroccan study documented a frequency of 43.2% among respondents (El Goundali et al., 2022). These findings are not just statistics; they highlight the persistent cultural significance of kinship awareness in marriage decisions across African communities.

However, in modern times, African communities face significant challenges to traditional genealogy systems. Urbanization, migration, and displacement have fragmented family units. While the loss of oral history increases as the older generations pass without transmitting their knowledge to the younger generation. Recognizing the urgency of this problem, FamilySearch began efforts to record oral family histories in Ghana in 2004 (*FamilySearch*, 2026). Research by Bush & Lynch, (2019) wrote about the weight of this preservation crisis. They stated that oral genealogies are at risk from war, deterioration, and competing for space in overcrowded archives. Today, FamilySearch provides financial support for over 5,000 African contract interviewers across 15 countries, including Nigeria, Ghana, Kenya, and Uganda, conducting more than 500,000 interviews and preserving over 190 million records (Bush & Lynch, 2019). By 2018, the organisation had collected over 16 million names across Africa, with the largest collections in Ghana (6.4 million), Nigeria (4 million), and Kenya (3.6 million) (Bush & Lynch, 2019).

The problems faced in traditional genealogy systems have serious implications for marriage practices. Research has shown that consanguinity can increase being prone to a range of chronic and complex diseases, including cancers, diabetes, cardiovascular diseases, and chronic respiratory diseases (El Goundali et al., 2022). Studies have further shown that consanguinity is associated with adverse reproductive outcomes including spontaneous abortions and stillbirth (Hussein et al., 2022). In the modern African society, which is characterized by geographical mobility and fractured family units, the traditional manual genealogy systems, which mostly rely on memory and oral transmission, is now largely inadequate for addressing these challenges.

Recent technological growth offers new opportunities to address these challenges. Graph databases have demonstrated significant potential for modelling elaborate relationship structures. Dirgahayu, (2024) presented a pattern-based method for creating a graph schema of genealogy enhanced for implementation in graph databases, identifying the family as the foundational pattern for schema development. Wang et al., (2024) took a broader approach, creating an integrated framework for knowledge inference and visualization using a knowledge graph for genealogy data, showing that genealogical information can be effectively broken down, then rearranged in order to visualize it properly. Yar & Tun, (2016) proposed a framework for exploring people’s relationships using graph databases, where individuals are represented as nodes with their attributes as properties, with algorithms built to look for connections between them.

But here's the catch: most of these platforms weren't built with African communities in mind. They're designed for Western populations and lack the culturally contextualised kinship verification mechanisms that African families actually need. Organisations like FamilySearch have done commendable work recording oral genealogies across the continent, but their focus has largely remained on preservation, not on building a systematic verification framework (Bush & Lynch, 2019; adedayoolumide, 2021). And while researchers have put significant effort in biometric kinship verification using facial recognition and computer vision (Qin et al., 2020; Wu et al., 2022), no much attention has been given to developing genealogical data-based verification systems for African contexts. That gap between what technology can do and what communities actually need is exactly what this study sets out to fill.

## 1.2 Problem Statement

A lot of African societies depend on elders and oral traditions to confirm family relationships before marriage, but what happens when the elders are no longer there to pass this knowledge on? That’s the reality of many communities today. Migration, urbanization and poor record-keeping have made these traditional ways difficult to sustain (Bush & Lynch, 2019). Families are now scattered across cities, countries, and even continents. The result? People may enter marriages with close relatives without being aware, this leads to cultural, social and genetic consequences (Fareed & Afzal, 2017; Hussein et al., 2022). Research shows a large number of consanguineous marriages in African communities and studies indicates a significant continuity in various regions (El Goundali et al., 2022; Hussein et al., 2022). Now, it's true that researchers have poured significant effort into biometric kinship verification using facial recognition and computer vision(Qin et al., 2020; Wu et al., 2022), but the problem is that there is no sustainable technology currently for systematically storing lineage information and verifying familial relationships within African communities using genealogical data. This gap leaves societies without accessible tools to address the growing problem of consanguineous marriages in African communities.

## 1.3 Aim

The aim of this research is to design, develop, and evaluate a Graph-Based Kinship Verification System for Ancestry Tracing and Marriage Eligibility Assessment in African Communities.

## 1.4 Objectives

The objectives of this research are:

1.  To analyse the existing methods of genealogy and kinship verification in order to identify their strengths and limitation in the African context.

2.  To design a graph-based kinship data model that shows the complex family structures of African communities.

3.  To develop a web-based ancestry registration and lineage management platform.

4.  To develop a kinship verification algorithm that can automatically detect familial relationships and assessing consanguinity risks.

5.  To evaluate the effectiveness and usability of the proposed platform through testing and user feedback.

## 1.5 Research Questions

This research addresses the following questions:

1.  How can lineage records be digitally represented in a way that shows the complexities of African family structures?

2.  How can kinship be automatically detected from genealogical data using graph-based algorithms?

3.  What level of relationship should trigger marriage warnings in the African socio-cultural context?

4.  How usable and effective is the proposed platform in supporting lineage management and kinship verification?

## 1.6 Scope of the Study

This study focuses on the design and evaluation of a kinship verification framework. The scope includes family registration, family tree generation, relationship verification, marriage eligibility checking, and lineage visualization. The following areas are excluded from the study: DNA testing and genetic analysis, medical diagnosis of genetic conditions, and government identity management systems. The focus is on genealogical relationship verification rather than biometric or genetic kinship detection.

## 1.7 Significance of the Study

This study holds significance for multiple stakeholders. Families gain a reliable mechanism for tracing lineage and assessing marriage eligibility. Traditional institutions gain a tool for preserving and transferring genealogical knowledge across generations. Marriage counsellors and religious bodies can use the system to provide informed guidance to families. Researchers get insights into the application of graph databases and algorithms in culturally specific situations. Cultural heritage organisations benefit from an organised framework for preserving oral genealogies. Ultimately, this platform contributes to the protection of African cultural heritage while addressing the current problems of consanguineous marriage in mobile, urbanized populations.

## 1.8 Definition of Terms

Consanguineous marriage: A union between individuals who are second cousins or closer, sharing a common ancestor within the previous four generations.

Genealogy: The systematic study and documentation of family lineages, ancestry, and descent relationships.

Graph Database: A database management system that uses graph structures with nodes, edges, and properties to represent and store data, enabling efficient relationship querying.

Kinship Verification: The process of identifying whether two individuals share a biological or genealogical relationship.

Lineage Tracing: The identification of ancestral connections between individuals across generations.

Oral Genealogy: A spoken lineage tradition common in parts of the world, especially in localities where few written records exist, serving as the main genealogical tool for researchers and communities.

