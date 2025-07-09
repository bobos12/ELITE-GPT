import './home.css';
import Navbar from '../component/Navbar/Navbar';
import Hero from '../component/Hero/Hero';
import Features from '../component/Features/Feature';
import FAQ from '../component/FAQ/Faq';
import Footer from '../component/Footer/Footer';
import Price from '../component/Pricing/Price';

const Home = () => {
  return (
    <div className="home">
      <Navbar/>
      <section id="Home"><Hero/></section>
      <section id="Features"><Features/></section>
      <section id="pricing"><Price/></section>
      <section id="FAQ"><FAQ/></section>
      <section id="footer"><Footer/></section>
    </div>
  );
};

export default Home;