# Lista com ideias e coisas pra fazer

aumentar canvas mas deixar pixelado -- ok

começar criando o canvas com a resolução correta (pesquisei e descobri a resolução) -- ok
pintar o fundo e desenha o cão ou o pato -- ok

começar a elaborar a cena
elaborar o loader e gerenciador de animações e scripts de movimento estado e afins
precisa configurar uma game loop

## Questões a resolver

* Sobre o AnimatedSprite: pensei em por hora usar um timestamp de quando a animação começou, fazer a diferença com o timestamp atual e fazer o módulo considerando o número de frames e a velocidade da animação. Se precisar desvincular do timestamp global seria só incrementar manualmente uma variável com o tempo decorrido.
* Sobre a interpolação e ou execução das ações sobre a entidade, um sistema de estados e processos a aplicar sobre a entidade seria interessante.
