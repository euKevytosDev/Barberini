package br.com.barberini.config;

import br.com.barberini.model.Barbeiro;
import br.com.barberini.model.Papel;
import br.com.barberini.model.Servico;
import br.com.barberini.model.Usuario;
import br.com.barberini.repository.BarbeiroRepository;
import br.com.barberini.repository.ServicoRepository;
import br.com.barberini.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
public class SeedConfig {

    @Bean
    CommandLineRunner seed(
            UsuarioRepository usuarios,
            BarbeiroRepository barbeiros,
            ServicoRepository servicos,
            PasswordEncoder encoder,
            @Value("${app.seed.dono.email}") String donoEmail,
            @Value("${app.seed.dono.senha}") String donoSenha,
            @Value("${app.seed.dono.nome}") String donoNome) {
        return args -> {
            if (!usuarios.existsByEmailIgnoreCase(donoEmail)) {
                usuarios.save(new Usuario(donoEmail.toLowerCase(), donoNome, encoder.encode(donoSenha), Papel.DONO));
            }
            if (barbeiros.count() == 0) {
                barbeiros.save(new Barbeiro("Abner Barber", "AB", "#3d3d3d"));
                barbeiros.save(new Barbeiro("Julio César", "JC", "#555555"));
                barbeiros.save(new Barbeiro("Lucas Barber", "LB", "#2a2a2a"));
            }
            if (servicos.count() == 0) {
                Object[][] lista = {
                        {"Acabamento barba", "15", 15},
                        {"Acabamento cabelo", "15", 15},
                        {"Barboterapia", "35", 30},
                        {"Barboterapia + acabamento cabelo", "50", 45},
                        {"Barboterapia + sobrancelha", "50", 40},
                        {"Corte", "45", 30},
                        {"Corte + acabamento barba", "60", 40},
                        {"Corte + acabamento barba + sobrancelha", "75", 50},
                        {"Corte + Barboterapia", "80", 60},
                        {"Corte + Barboterapia + selagem", "170", 90},
                        {"Corte + selagem", "135", 75},
                        {"Corte + sobrancelha", "60", 40},
                        {"Corte + barboterapia + sobrancelha", "95", 70},
                        {"Limpeza de pele (contra oleosidade)", "20", 20},
                        {"Selagem", "90", 60},
                        {"Sobrancelha", "15", 15},
                        {"Tintura (A partir de)", "40", 45},
                };
                for (Object[] s : lista) {
                    servicos.save(new Servico(
                            (String) s[0],
                            new BigDecimal((String) s[1]),
                            (Integer) s[2]
                    ));
                }
            }
        };
    }
}
