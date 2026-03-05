from reportlab.pdfgen import canvas
import sys
c = canvas.Canvas('test_rag_doc.pdf')
c.drawString(100, 750, 'Candidate Name: RAG Test Person')
c.drawString(100, 730, 'Skills: Expert Electrician, 15 years experience handling high voltage.')
c.drawString(100, 710, 'Certifications: Master Electrician, OSHA 30.')
c.save()
print('PDF created successfully')
