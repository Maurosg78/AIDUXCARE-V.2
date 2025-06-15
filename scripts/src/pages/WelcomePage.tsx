import React from 'react';
import {
  HeroTitle,
  HeroSubtitle,
  SectionTitle,
  FeatureTitle,
  FeatureDescription,
  StatNumber,
  StatLabel,
  CTAPrimaryButton,
  CTASecondaryButton,
  NavButton,
  BenefitIcon,
  BenefitCard,
  StatCard,
  BenefitsGrid,
  StatsGrid,
  SectionContainer,
  PageContainer,
  colors,
  spacing,
} from '../shared/components/UI';

// === COMPONENTE HEADER ===
const Header: React.FC = () => {
  const headerStyle: React.CSSProperties = {
    height: '80px',
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${spacing[6]}`,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: colors.primary[800],
    textDecoration: 'none',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[8],
    alignItems: 'center',
  };

  const navLinkStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '500',
    color: colors.gray[700],
    textDecoration: 'none',
    cursor: 'pointer',
  };

  return (
    <header style={headerStyle}>
      <div style={logoStyle}>
        🏥 AiDuxCare
      </div>
      
      <nav style={navStyle}>
        <a href="#inicio" style={navLinkStyle}>Inicio</a>
        <a href="#caracteristicas" style={navLinkStyle}>Características</a>
        <a href="#precios" style={navLinkStyle}>Precios</a>
        <a href="#contacto" style={navLinkStyle}>Contacto</a>
      </nav>
      
      <NavButton>
        Iniciar Sesión
      </NavButton>
    </header>
  );
};

// === COMPONENTE HERO ===
const HeroSection: React.FC = () => {
  const heroStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${colors.gray[50]} 0%, ${colors.primary[50]} 100%)`,
    minHeight: '700px',
    display: 'flex',
    alignItems: 'center',
  };

  const heroGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '60% 40%',
    gap: spacing[12],
    alignItems: 'center',
  };

  const heroContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[6],
  };

  const ctaGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    alignItems: 'center',
    marginTop: spacing[6],
  };

  const mockupStyle: React.CSSProperties = {
    width: '550px',
    height: '450px',
    backgroundColor: colors.white,
    borderRadius: '20px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    color: colors.gray[500],
    border: `2px solid ${colors.gray[100]}`,
  };

  return (
    <section style={heroStyle}>
      <PageContainer>
        <div style={heroGridStyle}>
          <div style={heroContentStyle}>
            <HeroTitle>
              EMR Inteligente + Copiloto Clínico IA
            </HeroTitle>
            
            <HeroSubtitle>
              Revoluciona tu práctica clínica con IA que entiende el contexto médico y mejora la precisión diagnóstica en tiempo real
            </HeroSubtitle>
            
            <div style={ctaGroupStyle}>
              <CTAPrimaryButton>
                Comenzar Prueba Gratuita
              </CTAPrimaryButton>
              
              <CTASecondaryButton>
                Ver Demo en Vivo
              </CTASecondaryButton>
            </div>
          </div>
          
          <div style={mockupStyle}>
            🏥 Dashboard Médico + IA
            <br />
            (Mockup Profesional)
          </div>
        </div>
      </PageContainer>
    </section>
  );
};

// === COMPONENTE BENEFICIOS ===
const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: 'microphone' as const,
      iconColor: colors.success[500],
      backgroundColor: colors.success[50],
      title: 'Transcripción Inteligente',
      description: 'Convierte automáticamente conversaciones clínicas en notas estructuradas y precisas',
    },
    {
      icon: 'document-text' as const,
      iconColor: colors.primary[500],
      backgroundColor: colors.primary[50],
      title: 'SOAP Automático',
      description: 'Genera formularios SOAP estructurados con IA médica especializada y validada',
    },
    {
      icon: 'shield-check' as const,
      iconColor: colors.purple[600],
      backgroundColor: colors.gray[100],
      title: 'Privacidad Total',
      description: 'Datos encriptados y procesamiento local. Cumple HIPAA y GDPR',
    },
  ];

  return (
    <SectionContainer backgroundColor={colors.white}>
      <div style={{ textAlign: 'center', marginBottom: spacing[20] }}>
        <SectionTitle>
          ¿Por qué elegir AiDuxCare?
        </SectionTitle>
      </div>
      
      <BenefitsGrid>
        {benefits.map((benefit, index) => (
          <BenefitCard key={index}>
            <BenefitIcon 
              name={benefit.icon}
              backgroundColor={benefit.backgroundColor}
              iconColor={benefit.iconColor}
            />
                         <div style={{ marginBottom: spacing[4] }}>
               <FeatureTitle>
                 {benefit.title}
               </FeatureTitle>
             </div>
            <FeatureDescription>
              {benefit.description}
            </FeatureDescription>
          </BenefitCard>
        ))}
      </BenefitsGrid>
    </SectionContainer>
  );
};

// === COMPONENTE CONFIANZA ===
const TrustSection: React.FC = () => {
  const stats = [
    { number: '95%', label: 'Precisión IA', color: colors.success[500] },
    { number: '40min', label: 'Tiempo ahorrado', color: colors.primary[500] },
    { number: '500+', label: 'Profesionales', color: colors.purple[600] },
    { number: '100%', label: 'Seguridad', color: colors.error[500] },
  ];

  return (
    <SectionContainer backgroundColor={colors.gray[50]}>
      <div style={{ textAlign: 'center', marginBottom: spacing[12] }}>
        <SectionTitle>
          Más de 500 profesionales confían en AiDuxCare
        </SectionTitle>
      </div>
      
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatNumber color={stat.color}>
              {stat.number}
            </StatNumber>
                         <div style={{ marginTop: spacing[2] }}>
               <StatLabel>
                 {stat.label}
               </StatLabel>
             </div>
          </StatCard>
        ))}
      </StatsGrid>
    </SectionContainer>
  );
};

// === COMPONENTE CTA FINAL ===
const FinalCTASection: React.FC = () => {
  const ctaStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
    textAlign: 'center',
  };

  const ctaContentStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[6],
    alignItems: 'center',
  };

  const ctaButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[5],
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <section style={ctaStyle}>
      <PageContainer>
        <div style={ctaContentStyle}>
          <SectionTitle>
            ¿Listo para transformar tu práctica clínica?
          </SectionTitle>
          
          <HeroSubtitle>
            Comienza tu prueba gratuita de 14 días. Sin tarjeta de crédito requerida
          </HeroSubtitle>
          
          <div style={ctaButtonsStyle}>
            <CTAPrimaryButton>
              Comenzar Ahora
            </CTAPrimaryButton>
            
            <CTASecondaryButton>
              Hablar con Ventas
            </CTASecondaryButton>
          </div>
        </div>
      </PageContainer>
    </section>
  );
};

// === COMPONENTE FOOTER ===
const Footer: React.FC = () => {
  const footerStyle: React.CSSProperties = {
    height: '150px',
    backgroundColor: colors.gray[50],
    borderTop: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
  };

  const footerContentStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  };

  const footerLogoStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: colors.primary[800],
  };

  const footerLinksStyle: React.CSSProperties = {
    fontSize: '14px',
    color: colors.gray[400],
    display: 'flex',
    gap: spacing[4],
  };

  const copyrightStyle: React.CSSProperties = {
    fontSize: '12px',
    color: colors.gray[400],
  };

  return (
    <footer style={footerStyle}>
      <PageContainer>
        <div style={footerContentStyle}>
          <div style={footerLogoStyle}>
            🏥 AiDuxCare
          </div>
          
          <div style={footerLinksStyle}>
            <span>Política de Privacidad</span>
            <span>•</span>
            <span>Términos</span>
            <span>•</span>
            <span>Soporte</span>
          </div>
          
          <div style={copyrightStyle}>
            © 2024 AiDuxCare. Todos los derechos reservados.
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

// === COMPONENTE PRINCIPAL ===
const WelcomePage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.white }}>
      <Header />
      <HeroSection />
      <BenefitsSection />
      <TrustSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default WelcomePage; 