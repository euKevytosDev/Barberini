package br.com.barberini.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "barbeiros")
@Getter
@Setter
@NoArgsConstructor
public class Barbeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, length = 4)
    private String iniciais;

    @Column(nullable = false, length = 20)
    private String cor = "#3d3d3d";

    @Column(nullable = false)
    private boolean ativo = true;

    public Barbeiro(String nome, String iniciais, String cor) {
        this.nome = nome;
        this.iniciais = iniciais;
        this.cor = cor;
    }
}
