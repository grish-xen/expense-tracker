import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <BootstrapNavbar bg="dark" variant="dark" expand="lg">
            <Container>
                <BootstrapNavbar.Brand as={Link} to="/">
                    📊 Учёт Покупок
                </BootstrapNavbar.Brand>

                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {isAuthenticated && (
                            <>
                                <Nav.Link as={Link} to="/">Главная</Nav.Link>
                                <Nav.Link as={Link} to="/purchases">Мои покупки</Nav.Link>
                                <Nav.Link as={Link} to="/stats">Статистика</Nav.Link>
                                <Nav.Link as={Link} to="/import-export">Импорт/Экспорт</Nav.Link>
                            </>
                        )}
                    </Nav>

                    <Nav>
                        {isAuthenticated ? (
                            <>
                                <Navbar.Text className="me-3">
                                    Привет, {user?.username}!
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={handleLogout}>
                                    Выйти
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button as={Link} to="/login" variant="outline-light" className="me-2">
                                    Войти
                                </Button>
                                <Button as={Link} to="/register" variant="light">
                                    Регистрация
                                </Button>
                            </>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
};

export default Navbar;