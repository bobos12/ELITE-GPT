import './home.css';
import Hero from '../component/Hero/Hero';
import Features from '../component/Features/Feature';
import FAQ from '../component/FAQ/Faq';
import Footer from '../component/Footer/Footer';
import Price from '../component/Pricing/Price';

const Home = () => {
  return (
    <div className="home">
      <section id="Home"><Hero/></section>
      <section id="Features"><Features/></section>
      <section id="pricing"><Price/></section>
      <section id="FAQ"><FAQ/></section>
      <section id="footer"><Footer/></section>
    </div>
  );
};

export default Home;
