from app.database import SessionLocal, engine
from app import models, utils


models.Base.metadata.create_all(bind=engine)

def create_super_admin():
    db = SessionLocal()

    # --- KONFIGURASI ADMIN ---
    admin_email = "wikan.admin@gmail.com"
    admin_password = "AdminWikan123!"
    admin_name = "Admin Wikan"
    
    print(f"[*] Mengecek apakah admin {admin_email} sudah ada...")

    try:
        existing_user = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if existing_user:
            print(f"[!] Admin dengan email {admin_email} SUDAH ADA di database.")
            print(f"[!] Role saat ini: {existing_user.role}")
            return

        print("[*] Membuat akun Admin baru...")
        
        hashed_pwd = utils.hash_password(admin_password)
        
        new_admin = models.User(
            email=admin_email,
            full_name=admin_name,
            password_hash=hashed_pwd,
            role="ADMIN",
        
            institution="WIKAN HQ",
            profession="System Administrator",
            phone_number="0000000000"
        )
        
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        
        print("------------------------------------------------")
        print(f"[SUCCESS] Admin Berhasil Dibuat!")
        print(f"Email    : {admin_email}")
        print(f"Password : {admin_password}")
        print(f"Role     : {new_admin.role}")
        print("------------------------------------------------")

    except Exception as e:
        print(f"[ERROR] Terjadi kesalahan: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()