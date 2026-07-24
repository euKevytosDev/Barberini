package br.com.barberini.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, length = 200)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Papel papel = Papel.CLIENTE;

    @Column(nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    public Usuario(String email, String nome, String senhaHash, Papel papel) {
        this.email = email;
        this.nome = nome;
        this.senhaHash = senhaHash;
        this.papel = papel;
    }
}
