
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectGallery from '@/components/ProjectGallery';
import { useAuth } from '@/context/AuthContext';
import { ProjectProvider } from '@/context/ProjectContext';

const IndexContent = () => {
  const { toggleRole } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header onRoleToggle={toggleRole} />
      
      <main className="flex-grow">
        <section className="py-10 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12 animate-fade-in">
              <span className="inline-block px-4 py-1 bg-gradient-to-r from-hexa-red/10 to-hexa-dark-red/10 rounded-full text-sm text-gray-700 mb-4">
                Portofolio Kami
              </span>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-hexa-red to-hexa-dark-red bg-clip-text text-transparent mb-4">
                Galeri Demo Hexa
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Lihat hasil kerja kami dalam merancang website, aplikasi dengan desain visual yang fungsional dan estetis. 
              Karya-karya yang akan menghidupkan ide Anda.
              </p>
            </div>
            
            <ProjectProvider>
              <ProjectGallery />
            </ProjectProvider>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

const Index = () => {
  return (
    <IndexContent />
  );
};

export default Index;
