from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas

path = "work/armonia-storage-test.pdf"
canvas = Canvas(path, pagesize=A4)
canvas.setTitle("Armonia Storage Test")
canvas.setFont("Helvetica-Bold", 18)
canvas.drawString(72, 770, "Armonia - test Storage Supabase")
canvas.setFont("Helvetica", 11)
canvas.drawString(72, 742, "Documento sintetico senza dati personali.")
canvas.drawString(72, 724, "Usato esclusivamente per verificare upload e signed URL.")
canvas.save()
