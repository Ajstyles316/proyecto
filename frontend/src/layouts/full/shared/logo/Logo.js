import { Link } from "react-router";
import logo from 'src/assets/images/logos/cofadena.jpg';
import { styled } from "@mui/material";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    <LinkStyled
      to="/"
      height={70}
      style={{
        display: "flex",
        alignItems: "center", justifyContent: 'center'
      }}
    >
      <Logo img={logo}/>
    </LinkStyled>
  );
};

export default Logo;
